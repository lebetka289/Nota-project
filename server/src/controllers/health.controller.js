const { queryOne } = require('../../config/database');

exports.getHealth = async (_req, res) => {
  try {
    await queryOne("SELECT 1");
    res.json({ status: 'ok', message: 'БД подключена и работает' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
