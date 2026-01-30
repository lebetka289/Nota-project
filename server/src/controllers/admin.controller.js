const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../../config/database');

// Получить всех пользователей
exports.getAllUsers = async (req, res) => {
  try {
    const users = await query(
      "SELECT id, email, name, role, blocked, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(users.map((u) => ({ ...u, blocked: !!u.blocked })));
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
};

// Обновить роль пользователя
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  
  if (!['user', 'admin', 'support', 'beatmaker', 'reporter'].includes(role)) {
    return res.status(400).json({ error: 'Неверная роль' });
  }

  try {
    await query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, req.params.id]
    );
    
    const user = await queryOne(
      "SELECT id, email, name, role, blocked FROM users WHERE id = ?",
      [req.params.id]
    );
    
    res.json({ ...user, blocked: !!user.blocked });
  } catch (error) {
    console.error('Ошибка обновления роли:', error);
    res.status(500).json({ error: 'Ошибка обновления роли' });
  }
};

// Заблокировать / разблокировать пользователя
exports.updateUserBlock = async (req, res) => {
  const { blocked } = req.body;
  if (typeof blocked !== 'boolean') {
    return res.status(400).json({ error: 'Укажите blocked: true или false' });
  }
  const targetId = Number(req.params.id);
  if (req.user.id === targetId && blocked) {
    return res.status(400).json({ error: 'Нельзя заблокировать себя' });
  }

  try {
    await query(
      "UPDATE users SET blocked = ? WHERE id = ?",
      [blocked ? 1 : 0, targetId]
    );
    
    const user = await queryOne(
      "SELECT id, email, name, role, blocked FROM users WHERE id = ?",
      [targetId]
    );
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    
    res.json({ ...user, blocked: !!user.blocked });
  } catch (error) {
    console.error('Ошибка блокировки:', error);
    res.status(500).json({ error: 'Ошибка обновления блокировки' });
  }
};

// Сменить пароль пользователя (админ)
exports.updateUserPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Пароль не менее 6 символов' });
  }

  try {
    const hashed = await bcrypt.hash(String(password), 10);
    await query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.params.id]);
    const user = await queryOne("SELECT id, email, name, role FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ message: 'Пароль обновлен', user });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({ error: 'Ошибка смены пароля' });
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
