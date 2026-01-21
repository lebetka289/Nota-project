const { query, queryOne } = require('../../config/database');

// Получить избранное
exports.getFavorites = async (req, res) => {
  try {
    const rows = await query(
      `SELECT bf.id, bf.beat_id, b.title, b.genre, b.bpm, b.price, b.cover_path, b.file_path, bf.created_at,
              bp.id as purchased_id
       FROM beat_favorites bf
       JOIN beats b ON bf.beat_id = b.id
       LEFT JOIN beat_purchases bp ON bp.user_id = bf.user_id AND bp.beat_id = b.id AND bp.status = 'paid'
       WHERE bf.user_id = ?
       ORDER BY bf.created_at DESC, bf.id DESC`,
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
    console.error('Ошибка получения избранного:', error);
    res.status(500).json({ error: 'Ошибка получения избранного' });
  }
};

// Добавить в избранное
exports.addToFavorites = async (req, res) => {
  const { beat_id } = req.body;
  if (!beat_id) {
    return res.status(400).json({ error: 'beat_id обязателен' });
  }

  try {
    const exists = await queryOne("SELECT id FROM beats WHERE id = ?", [beat_id]);
    if (!exists) return res.status(404).json({ error: 'Бит не найден' });

    const result = await query(
      "INSERT IGNORE INTO beat_favorites (user_id, beat_id) VALUES (?, ?)",
      [req.user.id, beat_id]
    );
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Бит уже в избранном' });
    }
    res.json({ message: 'Бит добавлен в избранное' });
  } catch (error) {
    console.error('Ошибка добавления в избранное:', error);
    res.status(500).json({ error: 'Ошибка добавления в избранное' });
  }
};

// Удалить из избранного
exports.removeFromFavorites = async (req, res) => {
  try {
    const result = await query(
      "DELETE FROM beat_favorites WHERE beat_id = ? AND user_id = ?",
      [req.params.beat_id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Бит не найден в избранном' });
    }
    res.json({ message: 'Бит удалён из избранного' });
  } catch (error) {
    console.error('Ошибка удаления из избранного:', error);
    res.status(500).json({ error: 'Ошибка удаления из избранного' });
  }
};

// Проверка, в избранном ли бит
exports.checkFavorite = async (req, res) => {
  try {
    const favorite = await queryOne(
      "SELECT id FROM beat_favorites WHERE beat_id = ? AND user_id = ?",
      [req.params.beat_id, req.user.id]
    );
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Ошибка проверки:', error);
    res.status(500).json({ error: 'Ошибка проверки' });
  }
};
