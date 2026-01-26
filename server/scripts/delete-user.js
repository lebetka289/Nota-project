// Загружаем переменные окружения
const path = require('path');
const envPath = path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

// Настройка подключения к БД
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nota_studio',
};

let pool;

async function deleteUser(email) {
  try {
    // Создаем пул соединений
    pool = mysql.createPool(dbConfig);
    
    console.log(`Подключение к БД: ${dbConfig.host}/${dbConfig.database}`);
    
    // Проверяем, существует ли пользователь
    const [users] = await pool.execute("SELECT id, email, name FROM users WHERE email = ?", [email]);
    
    if (users.length === 0) {
      console.log(`❌ Пользователь с email ${email} не найден`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`Найден пользователь:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);

    // Удаляем пользователя
    await pool.execute("DELETE FROM users WHERE email = ?", [email]);
    
    console.log(`✅ Пользователь ${email} успешно удален из базы данных`);
  } catch (error) {
    console.error('❌ Ошибка при удалении пользователя:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Подсказка: Убедитесь, что Docker запущен и база данных доступна.');
      console.error('   Или выполните команду через Docker:');
      console.error('   docker-compose exec server node scripts/delete-user.js maksman2100@mail.ru');
    }
    process.exit(1);
  } finally {
    try {
      if (pool) await pool.end();
    } catch {
      // ignore
    }
  }
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Укажите email пользователя для удаления');
  console.log('Использование: node delete-user.js <email>');
  process.exit(1);
}

deleteUser(email);
