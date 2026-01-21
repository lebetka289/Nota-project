const { query, queryOne } = require('../../config/database');

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
