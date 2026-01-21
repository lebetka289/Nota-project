require('dotenv').config();
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

process.on('SIGINT', () => {
  console.log('✅ Сервер остановлен');
  process.exit(0);
});
