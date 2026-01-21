const { query, queryOne } = require('../../config/database');

// Получить корзину
exports.getCart = async (req, res) => {
  try {
    const rows = await query(
      `SELECT bc.id, bc.beat_id, b.title, b.genre, b.bpm, b.price, b.cover_path, b.file_path, b.created_at,
              bp.id as purchased_id
       FROM beat_cart bc
       JOIN beats b ON bc.beat_id = b.id
       LEFT JOIN beat_purchases bp ON bp.user_id = bc.user_id AND bp.beat_id = b.id AND bp.status = 'paid'
       WHERE bc.user_id = ?
       ORDER BY bc.created_at DESC, bc.id DESC`,
      [req.user.id]
    );

    const host = req.get('host');
    const protocol = req.protocol;
    res.json(
      rows.map((x) => ({
        ...x,
        file_url: `${protocol}://${host}/api/beats/${x.beat_id}/stream`,
        cover_url: x.cover_path ? `${protocol}://${host}/uploads/${x.cover_path}` : null,
        download_url: `${protocol}://${host}/api/beats/${x.beat_id}/download`,
        purchased: !!x.purchased_id
      }))
    );
  } catch (error) {
    console.error('Ошибка получения корзины:', error);
    res.status(500).json({ error: 'Ошибка получения корзины' });
  }
};

// Добавить в корзину
exports.addToCart = async (req, res) => {
  const { beat_id } = req.body;
  if (!beat_id) {
    return res.status(400).json({ error: 'beat_id обязателен' });
  }

  try {
    const exists = await queryOne("SELECT id FROM beats WHERE id = ?", [beat_id]);
    if (!exists) return res.status(404).json({ error: 'Бит не найден' });

    const alreadyPaid = await queryOne(
      "SELECT id FROM beat_purchases WHERE user_id = ? AND beat_id = ? AND status = 'paid'",
      [req.user.id, beat_id]
    );
    if (alreadyPaid) {
      return res.status(400).json({ error: 'Этот бит уже куплен' });
    }

    const r = await query(
      "INSERT IGNORE INTO beat_cart (user_id, beat_id) VALUES (?, ?)",
      [req.user.id, beat_id]
    );
    if (r.affectedRows === 0) {
      return res.status(400).json({ error: 'Бит уже в корзине' });
    }
    res.json({ id: r.insertId, message: 'Бит добавлен в корзину' });
  } catch (error) {
    console.error('Ошибка добавления в корзину:', error);
    res.status(500).json({ error: 'Ошибка добавления в корзину' });
  }
};

// Удалить из корзины по id строки
exports.removeFromCart = async (req, res) => {
  try {
    const result = await query("DELETE FROM beat_cart WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Бит не найден в корзине' });
    }
    res.json({ message: 'Бит удалён из корзины' });
  } catch (error) {
    console.error('Ошибка удаления из корзины:', error);
    res.status(500).json({ error: 'Ошибка удаления из корзины' });
  }
};

// Очистка корзины
exports.clearCart = async (req, res) => {
  try {
    await query("DELETE FROM beat_cart WHERE user_id = ?", [req.user.id]);
    res.json({ message: 'Корзина очищена' });
  } catch (error) {
    console.error('Ошибка очистки корзины:', error);
    res.status(500).json({ error: 'Ошибка очистки корзины' });
  }
};
