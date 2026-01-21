const { query } = require('../../config/database');

// Получить элементы (совместимость)
exports.getItems = async (_req, res) => {
  try {
    const items = await query("SELECT * FROM items");
    res.json(items);
  } catch (error) {
    console.error('Ошибка получения данных:', error);
    res.status(500).json({ error: 'Ошибка получения данных' });
  }
};

// Добавить элемент (совместимость)
exports.createItem = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Поле name обязательно' });
  }
  try {
    const result = await query("INSERT INTO items (name) VALUES (?)", [name]);
    res.json({ id: result.insertId, name });
  } catch (error) {
    console.error('Ошибка добавления данных:', error);
    res.status(500).json({ error: 'Ошибка добавления данных' });
  }
};
