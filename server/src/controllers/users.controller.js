const path = require('path');
const fs = require('fs');
const { query, queryOne } = require('../../config/database');
const { UPLOADS_DIR } = require('../utils/upload');

// Публичный профиль
exports.getPublicProfile = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Некорректный id пользователя' });
  }

  try {
    const user = await queryOne(
      "SELECT id, name, role, created_at, avatar_path FROM users WHERE id = ?",
      [userId]
    );
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const avatar_url = user.avatar_path ? `${protocol}://${host}/uploads/${user.avatar_path}` : null;
    res.json({ id: user.id, name: user.name, role: user.role, created_at: user.created_at, avatar_url });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
};

// Загрузка аватарки (текущий пользователь)
exports.uploadAvatar = async (req, res) => {
  if (!req.file || !req.file.filename) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  const ext = (path.extname(req.file.originalname || '') || '').toLowerCase();
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (!allowed.includes(ext)) {
    fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename));
    return res.status(400).json({ error: 'Разрешены только изображения: jpg, png, gif, webp' });
  }

  try {
    const prev = await queryOne("SELECT avatar_path FROM users WHERE id = ?", [req.user.id]);
    if (prev && prev.avatar_path) {
      const oldPath = path.join(UPLOADS_DIR, prev.avatar_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    await query("UPDATE users SET avatar_path = ? WHERE id = ?", [req.file.filename, req.user.id]);
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const avatar_url = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ avatar_url });
  } catch (error) {
    console.error('Ошибка загрузки аватарки:', error);
    if (req.file && req.file.filename) {
      try { fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename)); } catch {}
    }
    res.status(500).json({ error: 'Ошибка загрузки аватарки' });
  }
};

// Публичные записи пользователя
exports.getUserRecordings = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Некорректный id пользователя' });
  }

  try {
    const recordings = await query(
      "SELECT id, recording_type, music_style, price, status, created_at FROM user_recordings WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(recordings);
  } catch (error) {
    console.error('Ошибка получения записей пользователя:', error);
    res.status(500).json({ error: 'Ошибка получения записей' });
  }
};

// Публичные покупки пользователя
exports.getUserPurchases = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Некорректный id пользователя' });
  }

  try {
    const purchases = await query(
      `SELECT 
        bp.id as purchase_id,
        bp.paid_at,
        bp.created_at,
        bp.status,
        bp.payment_status,
        b.id as beat_id,
        b.title,
        b.genre,
        b.bpm,
        b.price,
        b.cover_path
      FROM beat_purchases bp
      INNER JOIN beats b ON b.id = bp.beat_id
      WHERE bp.user_id = ? AND (bp.status = 'paid' OR bp.payment_status = 'succeeded')
      ORDER BY COALESCE(bp.paid_at, bp.created_at) DESC`,
      [userId]
    );
    res.json(purchases);
  } catch (error) {
    console.error('Ошибка получения покупок пользователя:', error);
    res.status(500).json({ error: 'Ошибка получения покупок' });
  }
};

// Неоплаченные покупки пользователя (для личного кабинета)
exports.getUserPendingPurchases = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Некорректный id пользователя' });
  }

  // Проверяем, что пользователь запрашивает свои покупки
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  try {
    const purchases = await query(
      `SELECT 
        bp.id as purchase_id,
        bp.created_at,
        bp.status,
        bp.payment_status,
        bp.payment_id,
        b.id as beat_id,
        b.title,
        b.genre,
        b.bpm,
        b.price,
        b.cover_path
      FROM beat_purchases bp
      INNER JOIN beats b ON b.id = bp.beat_id
      WHERE bp.user_id = ? AND bp.status = 'pending' AND (bp.payment_status IS NULL OR bp.payment_status != 'succeeded')
      ORDER BY bp.created_at DESC`,
      [userId]
    );
    const protocol = req.protocol || 'https';
    const host = req.get('host') || '';
    const withCoverUrl = purchases.map((p) => ({
      ...p,
      cover_url: p.cover_path ? `${protocol}://${host}/uploads/${p.cover_path}` : null
    }));
    res.json(withCoverUrl);
  } catch (error) {
    console.error('Ошибка получения неоплаченных покупок:', error);
    res.status(500).json({ error: 'Ошибка получения неоплаченных покупок' });
  }
};
