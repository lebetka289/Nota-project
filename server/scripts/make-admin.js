require('dotenv').config();
const { query, queryOne, pool } = require('../config/database');

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Использование: node scripts/make-admin.js <email>');
    process.exit(1);
  }

  try {
    const user = await queryOne('SELECT id, email, name, role FROM users WHERE email = ?', [email]);
    if (!user) {
      console.error(`Пользователь с email "${email}" не найден.`);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`Пользователь "${email}" уже админ.`);
      process.exit(0);
    }

    await query("UPDATE users SET role = 'admin' WHERE id = ?", [user.id]);
    console.log(`✅ Готово: "${email}" теперь admin.`);
  } catch (err) {
    console.error('Ошибка при назначении admin:', err.message);
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch {
      // ignore
    }
  }
}

main();
