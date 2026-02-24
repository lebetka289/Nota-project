const { query, queryOne } = require('../../config/database');
const { UPLOADS_DIR } = require('../utils/upload');
const path = require('path');

// Получить все опубликованные новости (опционально поиск по q)
exports.getAllNews = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const hasSearch = q.length > 0;
    const searchPattern = hasSearch ? `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%` : null;
    const sql = `SELECT n.id, n.title, n.content, n.image_url, n.tags, n.view_count, n.published_at, n.created_at,
              u.name as author_name, u.email as author_email, u.avatar_path as author_avatar_path,
              (SELECT COUNT(*) FROM news_likes WHERE news_id = n.id) as likes_count,
              (SELECT COUNT(*) FROM news_comments WHERE news_id = n.id) as comments_count
       FROM news n
       JOIN users u ON u.id = n.author_id
       WHERE n.published = 1
       ${hasSearch ? 'AND (n.title LIKE ? OR n.content LIKE ?)' : ''}
       ORDER BY n.published_at DESC, n.created_at DESC`;
    const rows = await query(sql, hasSearch ? [searchPattern, searchPattern] : []);
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    let news = rows.map((n) => ({
      ...n,
      view_count: Number(n.view_count || 0),
      likes_count: Number(n.likes_count || 0),
      comments_count: Number(n.comments_count || 0),
      tags: n.tags ? (typeof n.tags === 'string' ? JSON.parse(n.tags) : n.tags) : [],
      author_avatar_url: n.author_avatar_path ? `${protocol}://${host}/uploads/${n.author_avatar_path}` : null
    }));
    if (req.user && news.length > 0) {
      const ids = news.map((n) => n.id);
      const placeholders = ids.map(() => '?').join(',');
      const liked = await query(
        `SELECT news_id FROM news_likes WHERE user_id = ? AND news_id IN (${placeholders})`,
        [req.user.id, ...ids]
      );
      const likedSet = new Set((liked || []).map((l) => l.news_id));
      news = news.map((n) => ({ ...n, user_has_liked: likedSet.has(n.id) }));
    } else {
      news = news.map((n) => ({ ...n, user_has_liked: false }));
    }
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
      `SELECT n.id, n.title, n.content, n.image_url, n.tags, n.view_count, n.published_at, n.created_at,
              u.name as author_name, u.email as author_email, u.avatar_path as author_avatar_path,
              (SELECT COUNT(*) FROM news_likes WHERE news_id = n.id) as likes_count
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
      view_count: Number(row.view_count || 0),
      likes_count: Number(row.likes_count || 0),
      tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
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
      `SELECT n.id, n.title, n.content, n.image_url, n.tags, n.published, n.published_at, n.created_at,
              u.name as author_name, u.email as author_email, u.avatar_path as author_avatar_path
       FROM news n
       JOIN users u ON u.id = n.author_id
       ORDER BY n.created_at DESC`
    );
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const news = rows.map((n) => ({
      ...n,
      tags: n.tags ? (typeof n.tags === 'string' ? JSON.parse(n.tags) : n.tags) : [],
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
  const { title, content, image_url, published, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Заголовок и содержание обязательны' });
  }

  try {
    const publishedAt = published ? new Date() : null;
    const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(String(tags).split(',').map((t) => t.trim()).filter(Boolean)) : null);
    const result = await query(
      `INSERT INTO news (title, content, image_url, author_id, published, published_at, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, content, image_url || null, req.user.id, published ? 1 : 0, publishedAt, tagsStr]
    );
    const newsItem = await queryOne(
      `SELECT n.id, n.title, n.content, n.image_url, n.tags, n.published, n.published_at, n.created_at,
              u.name as author_name, u.email as author_email
       FROM news n
       JOIN users u ON u.id = n.author_id
       WHERE n.id = ?`,
      [result.insertId]
    );
    if (newsItem && newsItem.tags && typeof newsItem.tags === 'string') newsItem.tags = JSON.parse(newsItem.tags);
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

  const { title, content, image_url, published, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Заголовок и содержание обязательны' });
  }

  try {
    const existing = await queryOne('SELECT author_id, published_at FROM news WHERE id = ?', [newsId]);
    if (!existing) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }
    if (existing.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет доступа к редактированию этой новости' });
    }

    const publishedAt = published && !existing.published_at ? new Date() : existing.published_at;
    const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(String(tags).split(',').map((t) => t.trim()).filter(Boolean)) : null);
    await query(
      `UPDATE news SET title = ?, content = ?, image_url = ?, published = ?, published_at = ?, tags = ?
       WHERE id = ?`,
      [title, content, image_url || null, published ? 1 : 0, publishedAt, tagsStr, newsId]
    );
    const newsItem = await queryOne(
      `SELECT n.id, n.title, n.content, n.image_url, n.tags, n.published, n.published_at, n.created_at,
              u.name as author_name, u.email as author_email
       FROM news n
       JOIN users u ON u.id = n.author_id
       WHERE n.id = ?`,
      [newsId]
    );
    if (newsItem && newsItem.tags && typeof newsItem.tags === 'string') newsItem.tags = JSON.parse(newsItem.tags);
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

// Получить комментарии к новости
exports.getComments = async (req, res) => {
  const newsId = Number(req.params.id);
  if (!Number.isInteger(newsId)) {
    return res.status(400).json({ error: 'Некорректный id новости' });
  }
  try {
    const rows = await query(
      `SELECT c.id, c.news_id, c.user_id, c.body, c.created_at,
              u.name as user_name, u.avatar_path as user_avatar_path
       FROM news_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.news_id = ?
       ORDER BY c.created_at ASC`,
      [newsId]
    );
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const comments = rows.map((c) => ({
      id: c.id,
      news_id: c.news_id,
      user_id: c.user_id,
      body: c.body,
      created_at: c.created_at,
      user_name: c.user_name,
      user_avatar_url: c.user_avatar_path ? `${protocol}://${host}/uploads/${c.user_avatar_path}` : null
    }));
    res.json(comments);
  } catch (error) {
    console.error('Ошибка получения комментариев:', error);
    res.status(500).json({ error: 'Ошибка получения комментариев' });
  }
};

// Добавить комментарий (требуется авторизация)
exports.addComment = async (req, res) => {
  const newsId = Number(req.params.id);
  if (!Number.isInteger(newsId)) {
    return res.status(400).json({ error: 'Некорректный id новости' });
  }
  const { body } = req.body;
  if (!body || !String(body).trim()) {
    return res.status(400).json({ error: 'Текст комментария обязателен' });
  }
  try {
    const newsRow = await queryOne('SELECT id FROM news WHERE id = ? AND published = 1', [newsId]);
    if (!newsRow) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }
    const insertResult = await query(
      'INSERT INTO news_comments (news_id, user_id, body) VALUES (?, ?, ?)',
      [newsId, req.user.id, String(body).trim()]
    );
    const commentId = insertResult && insertResult.insertId;
    const comment = await queryOne(
      `SELECT c.id, c.news_id, c.user_id, c.body, c.created_at,
              u.name as user_name, u.avatar_path as user_avatar_path
       FROM news_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [commentId]
    );
    const host = req.get('host');
    const protocol = req.protocol || 'https';
    res.status(201).json({
      ...comment,
      user_avatar_url: comment.user_avatar_path ? `${protocol}://${host}/uploads/${comment.user_avatar_path}` : null
    });
  } catch (error) {
    console.error('Ошибка добавления комментария:', error);
    res.status(500).json({ error: 'Ошибка добавления комментария' });
  }
};

// Переключить лайк (требуется авторизация)
exports.toggleLike = async (req, res) => {
  const newsId = Number(req.params.id);
  if (!Number.isInteger(newsId)) {
    return res.status(400).json({ error: 'Некорректный id новости' });
  }
  try {
    const newsRow = await queryOne('SELECT id FROM news WHERE id = ? AND published = 1', [newsId]);
    if (!newsRow) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }
    const existing = await queryOne('SELECT 1 FROM news_likes WHERE news_id = ? AND user_id = ?', [newsId, req.user.id]);
    if (existing) {
      await query('DELETE FROM news_likes WHERE news_id = ? AND user_id = ?', [newsId, req.user.id]);
      const count = await queryOne('SELECT COUNT(*) as c FROM news_likes WHERE news_id = ?', [newsId]);
      return res.json({ liked: false, likes_count: Number(count.c) });
    } else {
      await query('INSERT INTO news_likes (news_id, user_id) VALUES (?, ?)', [newsId, req.user.id]);
      const count = await queryOne('SELECT COUNT(*) as c FROM news_likes WHERE news_id = ?', [newsId]);
      return res.json({ liked: true, likes_count: Number(count.c) });
    }
  } catch (error) {
    console.error('Ошибка лайка:', error);
    res.status(500).json({ error: 'Ошибка лайка' });
  }
};

// Проверить, поставил ли текущий пользователь лайк (для списка новостей)
exports.getNewsLikesState = async (req, res) => {
  const newsId = Number(req.params.id);
  if (!Number.isInteger(newsId)) return res.status(400).json({ error: 'Некорректный id' });
  if (!req.user) return res.json({ liked: false });
  const row = await queryOne('SELECT 1 FROM news_likes WHERE news_id = ? AND user_id = ?', [newsId, req.user.id]);
  res.json({ liked: !!row });
};

// Увеличить счётчик просмотров новости (при открытии попапа)
exports.incrementView = async (req, res) => {
  const newsId = Number(req.params.id);
  if (!Number.isInteger(newsId)) {
    return res.status(400).json({ error: 'Некорректный id новости' });
  }
  try {
    await query('UPDATE news SET view_count = IFNULL(view_count, 0) + 1 WHERE id = ? AND published = 1', [newsId]);
    const row = await queryOne('SELECT view_count FROM news WHERE id = ?', [newsId]);
    res.json({ view_count: Number(row?.view_count || 0) });
  } catch (error) {
    console.error('Ошибка счётчика просмотров:', error);
    res.status(500).json({ error: 'Ошибка счётчика просмотров' });
  }
};
