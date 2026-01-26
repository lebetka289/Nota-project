const nodemailer = require('nodemailer');

// Создание транспортера для отправки email
const createTransporter = () => {
  // Для Gmail и Mail.ru используем SMTP
  // Настройки берутся из переменных окружения
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn('⚠️ SMTP настройки не заданы. Email отправка отключена.');
    return null;
  }

  console.log(`📧 Настройка SMTP: ${smtpHost}:${smtpPort}, пользователь: ${smtpUser}`);

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false // Для Mail.ru иногда нужно
    }
  });
};

// Отправка кода подтверждения
exports.sendVerificationCode = async (email, code) => {
  const transporter = createTransporter();
  if (!transporter) {
    const mockMessage = `[MOCK EMAIL] Код подтверждения для ${email}: ${code}`;
    console.log(mockMessage);
    console.warn('⚠️ ВНИМАНИЕ: SMTP не настроен. Письма не отправляются!');
    console.warn('⚠️ Создайте файл .env и настройте SMTP_USER и SMTP_PASS');
    return { success: true, mock: true, message: mockMessage };
  }

  try {
    console.log('🔍 Проверка подключения к SMTP серверу...');
    await transporter.verify();
    console.log(`✅ SMTP подключение успешно (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`);
  } catch (error) {
    console.error('❌ Ошибка подключения к SMTP серверу:', error.message);
    console.error('   Код ошибки:', error.code);
    if (error.message.includes('Invalid login') || error.code === 'EAUTH') {
      console.error('💡 Подсказка: Проверьте правильность пароля.');
      console.error('   Для Mail.ru нужен пароль для внешних приложений, а не обычный пароль.');
      console.error('   Получить можно здесь: https://e.mail.ru/settings/security');
      console.error('   Раздел: "Пароли для внешних приложений"');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('💡 Подсказка: Проблема с подключением к серверу.');
      console.error('   Проверьте:');
      console.error('   - SMTP_HOST должен быть: smtp.mail.ru (для Mail.ru)');
      console.error('   - SMTP_PORT должен быть: 465 (для Mail.ru)');
      console.error('   - Интернет соединение активно');
    }
    return { success: false, error: `Ошибка SMTP: ${error.message}` };
  }

  try {
    console.log(`📤 Отправка письма на ${email}...`);
    const result = await transporter.sendMail({
      from: `"Nota Studio" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Код подтверждения email - Nota Studio',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF0032;">Подтверждение email</h2>
          <p>Ваш код подтверждения:</p>
          <div style="background: #111111; color: #FFFFFF; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #888888; font-size: 12px;">Код действителен в течение 10 минут.</p>
        </div>
      `
    });
    console.log(`✅ Письмо успешно отправлено на ${email} от ${process.env.SMTP_USER}`);
    console.log(`   Message ID: ${result.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error.message);
    console.error('   Код ошибки:', error.code);
    if (error.response) {
      console.error('   Ответ сервера:', error.response);
    }
    return { success: false, error: error.message };
  }
};

// Отправка файла трека пользователю
exports.sendTrackToUser = async (userEmail, userName, recordingType, musicStyle, filePath, fileName) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[MOCK EMAIL] Отправка трека ${fileName} для ${userEmail}`);
    return { success: true, mock: true };
  }

  try {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Файл не найден' };
    }

    await transporter.sendMail({
      from: `"Nota Studio" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Ваш трек готов - Nota Studio`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF0032;">Ваш трек готов!</h2>
          <p>Здравствуйте, ${userName}!</p>
          <p>Ваша запись готова и прикреплена к этому письму.</p>
          <div style="background: #111111; padding: 15px; margin: 20px 0; border-left: 3px solid #FF0032;">
            <p style="margin: 5px 0;"><strong>Тип записи:</strong> ${recordingType}</p>
            <p style="margin: 5px 0;"><strong>Стиль:</strong> ${musicStyle}</p>
          </div>
          <p>Спасибо за использование наших услуг!</p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          path: filePath
        }
      ]
    });
    return { success: true };
  } catch (error) {
    console.error('Ошибка отправки трека на email:', error);
    return { success: false, error: error.message };
  }
};
