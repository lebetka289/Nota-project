const { query, queryOne } = require('../../config/database');

// Получить отзывы (только за последние 3 месяца; старые не возвращаем и удаляем из БД)
exports.getReviews = async (req, res) => {
  try {
    await query(
      'DELETE FROM reviews WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH)'
    );
    const rows = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.id as user_id, u.name as user_name, u.role as user_role, u.avatar_path as user_avatar_path
       FROM reviews r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
       ORDER BY r.created_at DESC
       LIMIT 50`
    );
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const reviews = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      user_id: r.user_id,
      user_name: r.user_name,
      user_role: r.user_role,
      avatar_url: r.user_avatar_path ? `${protocol}://${host}/uploads/${r.user_avatar_path}` : null
    }));
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
    const row = await queryOne(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.id as user_id, u.name as user_name, u.role as user_role, u.avatar_path as user_avatar_path
       FROM reviews r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`,
      [result.insertId]
    );
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const review = {
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      user_id: row.user_id,
      user_name: row.user_name,
      user_role: row.user_role,
      avatar_url: row.user_avatar_path ? `${protocol}://${host}/uploads/${row.user_avatar_path}` : null
    };
    res.json(review);
  } catch (error) {
    console.error('Ошибка создания отзыва:', error);
    res.status(500).json({ error: 'Ошибка создания отзыва' });
  }
};
