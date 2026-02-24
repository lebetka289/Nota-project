const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../../config/database');
const { JWT_SECRET } = require('../middlewares/auth');
const { sendVerificationCode, sendPasswordResetLink } = require('../services/email.service');

// Регистрация
exports.register = async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const existingUser = await queryOne("SELECT id, email_verified FROM users WHERE email = ?", [email]);
    if (existingUser) {
      if (existingUser.email_verified) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      } else {
        // Пользователь существует, но не подтвердил email - обновляем код
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут
        
        await query(
          "UPDATE users SET password = ?, name = ?, verification_code = ?, verification_code_expires = ? WHERE email = ?",
          [await bcrypt.hash(password, 10), name, verificationCode, expiresAt, email]
        );
        
        await sendVerificationCode(email, verificationCode);
        return res.json({ success: true, message: 'Код подтверждения отправлен на email', requiresVerification: true });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    const result = await query(
      "INSERT INTO users (email, password, name, role, email_verified, verification_code, verification_code_expires) VALUES (?, ?, ?, 'user', 0, ?, ?)",
      [email, hashedPassword, name, verificationCode, expiresAt]
    );

    const emailResult = await sendVerificationCode(email, verificationCode);
    
    if (emailResult.mock) {
      console.warn(`⚠️ SMTP не настроен! Код для ${email}: ${verificationCode}`);
      res.json({ 
        success: true, 
        message: 'Код подтверждения отправлен на email (тестовый режим - проверьте консоль сервера)',
        requiresVerification: true,
        userId: result.insertId,
        mock: true,
        verificationCode: verificationCode // В тестовом режиме возвращаем код
      });
    } else if (!emailResult.success) {
      console.error('Ошибка отправки email:', emailResult.error);
      res.status(500).json({ 
        error: 'Не удалось отправить код подтверждения. Проверьте настройки SMTP.',
        details: emailResult.error
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Код подтверждения отправлен на email',
        requiresVerification: true,
        userId: result.insertId
      });
    }
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Авторизация
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    const user = await queryOne("SELECT id, email, password, name, role, email_verified, blocked, avatar_path FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ 
        error: 'Email не подтвержден',
        requiresVerification: true,
        userId: user.id
      });
    }

    if (user.blocked) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const avatar_url = user.avatar_path ? `${protocol}://${host}/uploads/${user.avatar_path}` : null;
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url }
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Подтверждение email
exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email и код обязательны' });
  }

  try {
    const user = await queryOne(
      "SELECT id, email, name, role, avatar_path, verification_code, verification_code_expires FROM users WHERE email = ?",
      [email]
    );

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.email_verified) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      const host = req.get('host');
      const protocol = req.protocol || 'https';
      const avatar_url = user.avatar_path ? `${protocol}://${host}/uploads/${user.avatar_path}` : null;
      return res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url },
        message: 'Email уже подтвержден'
      });
    }

    if (!user.verification_code || user.verification_code !== code) {
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    if (new Date(user.verification_code_expires) < new Date()) {
      return res.status(400).json({ error: 'Код подтверждения истек. Запросите новый код' });
    }

    await query(
      "UPDATE users SET email_verified = 1, verification_code = NULL, verification_code_expires = NULL WHERE id = ?",
      [user.id]
    );

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const avatar_url = user.avatar_path ? `${protocol}://${host}/uploads/${user.avatar_path}` : null;
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url },
      message: 'Email успешно подтвержден'
    });
  } catch (error) {
    console.error('Ошибка подтверждения email:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Повторная отправка кода
exports.resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email обязателен' });
  }

  try {
    const user = await queryOne("SELECT id, email_verified FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email уже подтвержден' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query(
      "UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE email = ?",
      [verificationCode, expiresAt, email]
    );

    const emailResult = await sendVerificationCode(email, verificationCode);
    
    if (emailResult.mock) {
      console.warn(`⚠️ SMTP не настроен! Код для ${email}: ${verificationCode}`);
      res.json({ 
        success: true, 
        message: 'Код подтверждения отправлен на email (тестовый режим)',
        mock: true,
        verificationCode: verificationCode
      });
    } else if (!emailResult.success) {
      res.status(500).json({ 
        error: 'Не удалось отправить код подтверждения. Проверьте настройки SMTP.',
        details: emailResult.error
      });
    } else {
      res.json({ success: true, message: 'Код подтверждения отправлен на email' });
    }
  } catch (error) {
    console.error('Ошибка повторной отправки кода:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Запрос сброса пароля: отправка ссылки на email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Укажите email' });
  }
  try {
    const user = await queryOne('SELECT id, email FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 час
    await query(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [token, expires, user.id]
    );
    // Ссылка на тот же хост и порт, на котором открыт сайт (или FRONTEND_URL)
    const origin = req.get('Origin') || req.get('Referer');
    const baseUrl = process.env.FRONTEND_URL
      || (origin ? origin.replace(/\/$/, '').replace(/#.*$/, '').split('?')[0] : null)
      || (process.env.NODE_ENV === 'production' ? `${req.protocol || 'https'}://${req.get('host')}`.replace(/:5000$/, ':5173') : 'http://localhost:5173');
    const resetUrl = `${baseUrl.replace(/\/$/, '')}?page=reset-password&token=${token}`;
    const result = await sendPasswordResetLink(email, resetUrl);
    if (result.mock) {
      console.warn(`⚠️ Ссылка сброса пароля для ${email}: ${resetUrl}`);
    }
    if (!result.success) {
      return res.status(500).json({ error: 'Не удалось отправить письмо. Попробуйте позже.' });
    }
    res.json({ success: true, message: 'Ссылка для сброса пароля отправлена на email' });
  } catch (error) {
    console.error('Ошибка forgotPassword:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Смена пароля по токену из ссылки
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Токен и новый пароль обязательны' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
  }
  try {
    const user = await queryOne(
      'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    );
    if (!user) {
      return res.status(400).json({ error: 'Ссылка недействительна или истекла. Запросите сброс пароля снова.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await query(
      'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [hashed, user.id]
    );
    res.json({ success: true, message: 'Пароль успешно изменён' });
  } catch (error) {
    console.error('Ошибка resetPassword:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Получение текущего пользователя
exports.getMe = async (req, res) => {
  try {
    const user = await queryOne("SELECT id, email, name, role, avatar_path FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const avatar_url = user.avatar_path ? `${protocol}://${host}/uploads/${user.avatar_path}` : null;
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, avatar_url });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
