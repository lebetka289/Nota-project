const { query, queryOne } = require('../../config/database');

// Получение всех товаров
exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let sql = "SELECT * FROM products";
    const params = [];

    if (category && category !== 'all') {
      sql += " WHERE category = ?";
      params.push(category);
    }

    sql += " ORDER BY created_at DESC";

    const products = await query(sql, params);
    res.json(products);
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ error: 'Ошибка получения товаров' });
  }
};

// Получение одного товара
exports.getProduct = async (req, res) => {
  try {
    const product = await queryOne("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(product);
  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({ error: 'Ошибка получения товара' });
  }
};

// Добавление товара (только админ)
exports.createProduct = async (req, res) => {
  const { name, description, category, sizes, price } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Название, категория и цена обязательны' });
  }

  try {
    const result = await query(
      "INSERT INTO products (name, description, category, sizes, price) VALUES (?, ?, ?, ?, ?)",
      [name, description || '', category, sizes || '', price]
    );
    res.json({ id: result.insertId, name, description, category, sizes, price });
  } catch (error) {
    console.error('Ошибка добавления товара:', error);
    res.status(500).json({ error: 'Ошибка добавления товара' });
  }
};

// Обновление товара (только админ)
exports.updateProduct = async (req, res) => {
  const { name, description, category, sizes, price } = req.body;

  try {
    const result = await query(
      "UPDATE products SET name = ?, description = ?, category = ?, sizes = ?, price = ? WHERE id = ?",
      [name, description, category, sizes, price, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json({ message: 'Товар обновлен' });
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    res.status(500).json({ error: 'Ошибка обновления товара' });
  }
};

// Удаление товара (только админ)
exports.deleteProduct = async (req, res) => {
  try {
    const result = await query("DELETE FROM products WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json({ message: 'Товар удален' });
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({ error: 'Ошибка удаления товара' });
  }
};
