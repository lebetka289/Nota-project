const { query, queryOne } = require('../../config/database');
const { UPLOADS_DIR } = require('../utils/upload');
const path = require('path');

// Получить все опубликованные новости
exports.getAllNews = async (req, res) => {
  try {
    const rows = await query(
      `SELECT n.id, n.title, n.content, n.image_url, n.published_at, n.created_at,
              u.name as author_name, u.email as author_email, u.avatar_path as author_avatar_path
       FROM news n
       JOIN users u ON u.id = n.author_id
       WHERE n.published = 1
       ORDER BY n.published_at DESC, n.created_at DESC`
    );
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const news = rows.map((n) => ({
      ...n,
      author_avatar_url: n.author_avatar_path ? `${protocol}://${host}/uploads/${n.author_avatar_path}` : null
    }));
    res.json(news);
  } catch (error) {
    console.error('Ошибка получения новостей:', error);
    res.status(500).json({ error: 'Ошибка получения новостей' });
  }
};

// Получить одну новость
exports.getNewsById = async (req, res) => {
  const newsId = Number(req.params.id);
  if (!Number.isInteger(newsId)) {
    return res.status(400).json({ error: 'Некорректный id новости' });
  }

  try {
    const row = await queryOne(
      `SELECT n.id, n.title, n.content, n.image_url, n.published_at, n.created_at,
              u.name as author_name, u.email as author_email, u.avatar_path as author_avatar_path
       FROM news n
       JOIN users u ON u.id = n.author_id
       WHERE n.id = ? AND n.published = 1`,
      [newsId]
    );
    if (!row) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const newsItem = {
      ...row,
      author_avatar_url: row.author_avatar_path ? `${protocol}://${host}/uploads/${row.author_avatar_path}` : null
    };
    res.json(newsItem);
  } catch (error) {
    console.error('Ошибка получения новости:', error);
    res.status(500).json({ error: 'Ошибка получения новости' });
  }
};

// Получить все новости (для репортера/админа)
exports.getAllNewsAdmin = async (req, res) => {
  try {
    const rows = await query(
      `SELECT n.id, n.title, n.content, n.image_url, n.published, n.published_at, n.created_at,
              u.name as author_name, u.email as author_email, u.avatar_path as author_avatar_path
       FROM news n
       JOIN users u ON u.id = n.author_id
       ORDER BY n.created_at DESC`
    );
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const news = rows.map((n) => ({
      ...n,
      author_avatar_url: n.author_avatar_path ? `${protocol}://${host}/uploads/${n.author_avatar_path}` : null
    }));
    res.json(news);
  } catch (error) {
    console.error('Ошибка получения новостей:', error);
    res.status(500).json({ error: 'Ошибка получения новостей' });
  }
};

// Создать новость
exports.createNews = async (req, res) => {
  const { title, content, image_url, published } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Заголовок и содержание обязательны' });
  }

  try {
    const publishedAt = published ? new Date() : null;
    const result = await query(
      `INSERT INTO news (title, content, image_url, author_id, published, published_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, image_url || null, req.user.id, published ? 1 : 0, publishedAt]
    );
    const newsItem = await queryOne(
      `SELECT n.id, n.title, n.content, n.image_url, n.published, n.published_at, n.created_at,
              u.name as author_name, u.email as author_email
       FROM news n
       JOIN users u ON u.id = n.author_id
       WHERE n.id = ?`,
      [result.insertId]
    );
    res.status(201).json(newsItem);
  } catch (error) {
    console.error('Ошибка создания новости:', error);
    res.status(500).json({ error: 'Ошибка создания новости' });
  }
};

// Обновить новость
exports.updateNews = async (req, res) => {
  const newsId = Number(req.params.id);
  if (!Number.isInteger(newsId)) {
    return res.status(400).json({ error: 'Некорректный id новости' });
  }

  const { title, content, image_url, published } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Заголовок и содержание обязательны' });
  }

  try {
    const existing = await queryOne('SELECT author_id FROM news WHERE id = ?', [newsId]);
    if (!existing) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }
    if (existing.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет доступа к редактированию этой новости' });
    }

    const publishedAt = published && !existing.published_at ? new Date() : existing.published_at;
    await query(
      `UPDATE news SET title = ?, content = ?, image_url = ?, published = ?, published_at = ?
       WHERE id = ?`,
      [title, content, image_url || null, published ? 1 : 0, publishedAt, newsId]
    );
    const newsItem = await queryOne(
      `SELECT n.id, n.title, n.content, n.image_url, n.published, n.published_at, n.created_at,
              u.name as author_name, u.email as author_email
       FROM news n
       JOIN users u ON u.id = n.author_id
       WHERE n.id = ?`,
      [newsId]
    );
    res.json(newsItem);
  } catch (error) {
    console.error('Ошибка обновления новости:', error);
    res.status(500).json({ error: 'Ошибка обновления новости' });
  }
};

// Загрузить изображение
exports.uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ image_url: imageUrl });
};

// Удалить новость
exports.deleteNews = async (req, res) => {
  const newsId = Number(req.params.id);
  if (!Number.isInteger(newsId)) {
    return res.status(400).json({ error: 'Некорректный id новости' });
  }

  try {
    const existing = await queryOne('SELECT author_id FROM news WHERE id = ?', [newsId]);
    if (!existing) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }
    if (existing.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет доступа к удалению этой новости' });
    }
    await query('DELETE FROM news WHERE id = ?', [newsId]);
    res.json({ message: 'Новость удалена' });
  } catch (error) {
    console.error('Ошибка удаления новости:', error);
    res.status(500).json({ error: 'Ошибка удаления новости' });
  }
};
