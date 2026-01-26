const { query, queryOne } = require('../../config/database');
const { sendTrackToUser } = require('../services/email.service');
const path = require('path');
const fs = require('fs');

// Создать запись
exports.createRecording = async (req, res) => {
  const { recording_type, music_style, price } = req.body;

  if (!recording_type || !music_style) {
    return res.status(400).json({ error: 'Тип записи и стиль музыки обязательны' });
  }

  try {
    const result = await query(
      "INSERT INTO user_recordings (user_id, recording_type, music_style, price, status) VALUES (?, ?, ?, ?, 'pending')",
      [req.user.id, recording_type, music_style, price ?? null]
    );
    res.json({
      id: result.insertId,
      recording: { id: result.insertId, recording_type, music_style, status: 'pending' }
    });
  } catch (error) {
    console.error('Ошибка сохранения записи:', error);
    res.status(500).json({ error: 'Ошибка сохранения записи' });
  }
};

// Получить мои записи
exports.getMyRecordings = async (req, res) => {
  try {
    const recordings = await query(
      "SELECT * FROM user_recordings WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(recordings);
  } catch (error) {
    console.error('Ошибка получения записей:', error);
    res.status(500).json({ error: 'Ошибка получения записей' });
  }
};

// Получить одну запись
exports.getRecordingById = async (req, res) => {
  try {
    const recording = await queryOne(
      "SELECT * FROM user_recordings WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (!recording) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    res.json(recording);
  } catch (error) {
    console.error('Ошибка получения записи:', error);
    res.status(500).json({ error: 'Ошибка получения записи' });
  }
};

// Получить все записи (admin)
exports.getAllRecordings = async (req, res) => {
  try {
    const recordings = await query(
      `SELECT r.*, u.email as user_email, u.name as user_name
       FROM user_recordings r
       LEFT JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    );
    res.json(recordings);
  } catch (error) {
    console.error('Ошибка получения всех записей:', error);
    res.status(500).json({ error: 'Ошибка получения записей' });
  }
};

// Обновить статус записи (admin)
exports.updateRecordingStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await query(
      "UPDATE user_recordings SET status = ? WHERE id = ?",
      [status, req.params.id]
    );
    const recording = await queryOne("SELECT * FROM user_recordings WHERE id = ?", [req.params.id]);
    res.json(recording);
  } catch (error) {
    console.error('Ошибка обновления записи:', error);
    res.status(500).json({ error: 'Ошибка обновления записи' });
  }
};

// Получить оплаченные записи для битмейкера
exports.getPaidRecordings = async (req, res) => {
  try {
    const recordings = await query(
      `SELECT r.*, u.email as user_email, u.name as user_name
       FROM user_recordings r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.status = 'paid' OR r.status = 'in-progress'
       ORDER BY r.paid_at DESC, r.created_at DESC`
    );
    res.json(recordings);
  } catch (error) {
    console.error('Ошибка получения оплаченных записей:', error);
    res.status(500).json({ error: 'Ошибка получения записей' });
  }
};

// Загрузить файл трека для записи
exports.uploadTrack = async (req, res) => {
  try {
    const recordingId = Number(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const recording = await queryOne(
      "SELECT * FROM user_recordings WHERE id = ? AND (status = 'paid' OR status = 'in-progress')",
      [recordingId]
    );

    if (!recording) {
      // Удаляем загруженный файл если запись не найдена
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Запись не найдена или не оплачена' });
    }

    // Удаляем старый файл если есть
    if (recording.track_file_path && fs.existsSync(recording.track_file_path)) {
      fs.unlinkSync(recording.track_file_path);
    }

    const trackPath = req.file.path;
    await query(
      "UPDATE user_recordings SET track_file_path = ? WHERE id = ?",
      [trackPath, recordingId]
    );

    res.json({ 
      success: true, 
      message: 'Файл трека загружен',
      track_file_path: trackPath
    });
  } catch (error) {
    console.error('Ошибка загрузки трека:', error);
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
};

// Отправить трек на email пользователя
exports.sendTrackToUser = async (req, res) => {
  try {
    const recordingId = Number(req.params.id);
    const recording = await queryOne(
      `SELECT r.*, u.email as user_email, u.name as user_name
       FROM user_recordings r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ? AND (r.status = 'paid' OR r.status = 'in-progress')`,
      [recordingId]
    );

    if (!recording) {
      return res.status(404).json({ error: 'Запись не найдена или не оплачена' });
    }

    if (!recording.track_file_path || !fs.existsSync(recording.track_file_path)) {
      return res.status(400).json({ error: 'Файл трека не загружен' });
    }

    if (!recording.user_email) {
      return res.status(400).json({ error: 'Email пользователя не найден' });
    }

    const recordingTypesNames = {
      'own-music': 'Запись на свою музыку',
      'with-music': 'Запись с покупкой музыки',
      'buy-music': 'Покупка музыки',
      'home-recording': 'Запись из дома',
      'video-clip': 'Съёмка видеоклипа'
    };

    const musicStylesNames = {
      'hyperpop': 'Хайпер поп',
      'pop-rock': 'Поп рок',
      'indie': 'Инди',
      'lofi': 'Low-fi',
      'russian-rap': 'Русский реп',
      'funk': 'Фонк',
      'video-clip': 'Видеоклип'
    };

    const fileName = path.basename(recording.track_file_path);
    const result = await sendTrackToUser(
      recording.user_email,
      recording.user_name,
      recordingTypesNames[recording.recording_type] || recording.recording_type,
      musicStylesNames[recording.music_style] || recording.music_style,
      recording.track_file_path,
      fileName
    );

    if (result.success) {
      await query(
        "UPDATE user_recordings SET status = 'completed' WHERE id = ?",
        [recordingId]
      );
      res.json({ success: true, message: 'Трек отправлен на email пользователя' });
    } else {
      res.status(500).json({ error: result.error || 'Ошибка отправки email' });
    }
  } catch (error) {
    console.error('Ошибка отправки трека:', error);
    res.status(500).json({ error: 'Ошибка отправки трека' });
  }
};
