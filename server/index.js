// Загружаем переменные окружения из основного .env в корне проекта (../.env),
// если он есть. В Docker переменные приходят из docker-compose и тоже будут доступны.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('./src/app');
const { initDatabase } = require('./src/services/database.service');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error.message);
    process.exit(1);
  }
};

startServer();

const shutdown = (signal) => {
  console.log(`✅ Получен ${signal}, сервер останавливается...`);
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
