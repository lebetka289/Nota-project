const mysql = require('mysql2/promise');

// Конфигурация подключения к MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nota_studio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Создаем пул соединений
const pool = mysql.createPool(dbConfig);

// Функция для выполнения запросов
const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Ошибка выполнения запроса:', error);
    throw error;
  }
};

// Функция для получения одного результата
const queryOne = async (sql, params) => {
  const results = await query(sql, params);
  return results[0] || null;
};

// Функция для проверки подключения
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Подключение к MySQL успешно установлено');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к MySQL:', error.message);
    return false;
  }
};

// Функция для создания базы данных, если её нет
const createDatabaseIfNotExists = async () => {
  try {
    const tempPool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: 1
    });

    await tempPool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempPool.end();
    console.log(`✅ База данных ${dbConfig.database} готова`);
  } catch (error) {
    console.error('Ошибка создания базы данных:', error.message);
  }
};

module.exports = {
  pool,
  query,
  queryOne,
  testConnection,
  createDatabaseIfNotExists,
  dbConfig
};
