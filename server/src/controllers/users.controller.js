const { query, queryOne } = require('../../config/database');

// Публичный профиль
exports.getPublicProfile = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Некорректный id пользователя' });
  }

  try {
    const user = await queryOne(
      "SELECT id, name, role, created_at FROM users WHERE id = ?",
      [userId]
    );
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка получения профиля' });
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
