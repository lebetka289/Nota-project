const { query, queryOne } = require('../../config/database');

// Получить отзывы
exports.getReviews = async (_req, res) => {
  try {
    const reviews = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.id as user_id, u.name as user_name, u.role as user_role
       FROM reviews r
       INNER JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC
       LIMIT 50`
    );
    res.json(reviews);
  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    res.status(500).json({ error: 'Ошибка получения отзывов' });
  }
};

// Создать отзыв
exports.createReview = async (req, res) => {
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
  }
  if (!comment || comment.length > 1500) {
    return res.status(400).json({ error: 'Комментарий должен быть от 1 до 1500 символов' });
  }

  try {
    const result = await query(
      "INSERT INTO reviews (user_id, rating, comment) VALUES (?, ?, ?)",
      [req.user.id, rating, comment]
    );
    const review = await queryOne(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.id as user_id, u.name as user_name, u.role as user_role
       FROM reviews r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`,
      [result.insertId]
    );
    res.json(review);
  } catch (error) {
    console.error('Ошибка создания отзыва:', error);
    res.status(500).json({ error: 'Ошибка создания отзыва' });
  }
};
