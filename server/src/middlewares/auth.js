const jwt = require('jsonwebtoken');
const { queryOne } = require('../../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Функция для получения пользователя из заголовка Authorization
const getUserFromAuthHeader = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const dbUser = await queryOne("SELECT id, email, name, role FROM users WHERE id = ?", [payload.id]);
    return dbUser || null;
  } catch {
    return null;
  }
};

// Middleware для проверки токена
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const dbUser = await queryOne(
      "SELECT id, email, name, role, blocked FROM users WHERE id = ?",
      [payload.id]
    );
    if (!dbUser) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    if (dbUser.blocked) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }
    req.user = dbUser;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

// Middleware для проверки роли админа
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуется роль администратора' });
  }
  next();
};

// Middleware для проверки роли битмейкера или админа
const isBeatmakerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'beatmaker') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуется роль beatmaker или администратора' });
  }
  next();
};

// Middleware для проверки роли поддержки или админа
const isSupportOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'support') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуется роль поддержки или администратора' });
  }
  next();
};

module.exports = {
  JWT_SECRET,
  getUserFromAuthHeader,
  authenticateToken,
  isAdmin,
  isBeatmakerOrAdmin,
  isSupportOrAdmin
};
