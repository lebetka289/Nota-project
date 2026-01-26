const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../../config/database');
const { JWT_SECRET } = require('../middlewares/auth');
const { sendVerificationCode } = require('../services/email.service');

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
    const user = await queryOne("SELECT * FROM users WHERE email = ?", [email]);
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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role } 
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
      "SELECT id, email, name, role, verification_code, verification_code_expires FROM users WHERE email = ?",
      [email]
    );

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.email_verified) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      return res.json({ 
        token, 
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
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
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
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

// Получение текущего пользователя
exports.getMe = async (req, res) => {
  try {
    const user = await queryOne("SELECT id, email, name, role FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
