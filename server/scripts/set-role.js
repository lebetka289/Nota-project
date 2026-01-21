require('dotenv').config();
const { query, queryOne, pool } = require('../config/database');

async function main() {
  const email = process.argv[2];
  const role = process.argv[3];

  if (!email || !role) {
    console.error('Использование: node scripts/set-role.js <email> <role>');
    console.error('Пример: node scripts/set-role.js user@mail.com support');
    process.exit(1);
  }

  const allowed = new Set(['user', 'admin', 'support', 'beatmaker']);
  if (!allowed.has(role)) {
    console.error(`Недопустимая роль "${role}". Разрешены: user | admin | support | beatmaker`);
    process.exit(1);
  }

  try {
    const user = await queryOne('SELECT id, email, name, role FROM users WHERE email = ?', [email]);
    if (!user) {
      console.error(`Пользователь с email "${email}" не найден.`);
      process.exit(1);
    }

    await query('UPDATE users SET role = ? WHERE id = ?', [role, user.id]);
    console.log(`✅ Готово: "${email}" теперь role="${role}".`);
  } catch (err) {
    console.error('Ошибка при назначении роли:', err.message);
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

