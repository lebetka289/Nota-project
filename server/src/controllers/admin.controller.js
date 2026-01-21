const { query, queryOne } = require('../../config/database');

// Получить всех пользователей
exports.getAllUsers = async (req, res) => {
  try {
    const users = await query(
      "SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
};

// Обновить роль пользователя
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  
  if (!['user', 'admin', 'support', 'beatmaker'].includes(role)) {
    return res.status(400).json({ error: 'Неверная роль' });
  }

  try {
    await query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, req.params.id]
    );
    
    const user = await queryOne(
      "SELECT id, email, name, role FROM users WHERE id = ?",
      [req.params.id]
    );
    
    res.json(user);
  } catch (error) {
    console.error('Ошибка обновления роли:', error);
    res.status(500).json({ error: 'Ошибка обновления роли' });
  }
};

// Удалить пользователя
exports.deleteUser = async (req, res) => {
  try {
    await query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
};

// Получить статистику
exports.getStatistics = async (req, res) => {
  try {
    const usersCount = await queryOne("SELECT COUNT(*) as count FROM users");
    const beatsCount = await queryOne("SELECT COUNT(*) as count FROM beats");
    const recordingsCount = await queryOne("SELECT COUNT(*) as count FROM user_recordings");
    const purchasesCount = await queryOne("SELECT COUNT(*) as count FROM beat_purchases WHERE status = 'paid'");
    
    const totalRevenue = await queryOne(
      "SELECT COALESCE(SUM(price), 0) as total FROM beat_purchases WHERE status = 'paid'"
    );

    res.json({
      users: usersCount.count,
      beats: beatsCount.count,
      recordings: recordingsCount.count,
      purchases: purchasesCount.count,
      revenue: totalRevenue.total
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
};
