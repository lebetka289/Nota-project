const fs = require('fs');
const path = require('path');
const { query, queryOne } = require('../../config/database');
const { getUserFromAuthHeader } = require('../middlewares/auth');
const { UPLOADS_DIR } = require('../utils/upload');

// Список битов (публично)
exports.getAllBeats = async (req, res) => {
  try {
    const maybeUser = await getUserFromAuthHeader(req);
    let purchasedSet = null;
    if (maybeUser) {
      const pr = await query(
        "SELECT beat_id FROM beat_purchases WHERE user_id = ? AND status = 'paid'",
        [maybeUser.id]
      );
      purchasedSet = new Set(pr.map((x) => x.beat_id));
    }

    const { genre, q } = req.query;
    const params = [];
    let sql = "SELECT id, title, genre, bpm, price, cover_path, file_path, created_at FROM beats";
    const where = [];

    if (genre && genre !== 'all') {
      where.push("genre = ?");
      params.push(genre);
    }
    if (q) {
      where.push("(LOWER(title) LIKE ?)");
      params.push(`%${String(q).toLowerCase()}%`);
    }
    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY created_at DESC, id DESC";

    const rows = await query(sql, params);
    const host = req.get('host');
    const protocol = req.protocol;
    const mapped = rows.map((b) => ({
      ...b,
      file_url: `${protocol}://${host}/api/beats/${b.id}/stream`,
      cover_url: b.cover_path ? `${protocol}://${host}/uploads/${b.cover_path}` : null,
      purchased: purchasedSet ? purchasedSet.has(b.id) : false
    }));
    res.json(mapped);
  } catch (e) {
    console.error('Ошибка получения битов:', e);
    res.status(500).json({ error: 'Ошибка получения битов' });
  }
};

// Мои биты (beatmaker/admin)
exports.getMyBeats = async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, title, genre, bpm, price, cover_path, file_path, created_at FROM beats WHERE created_by = ? ORDER BY created_at DESC, id DESC",
      [req.user.id]
    );
    const host = req.get('host');
    const protocol = req.protocol;
    res.json(
      rows.map((b) => ({
        ...b,
        file_url: `${protocol}://${host}/api/beats/${b.id}/stream`,
        cover_url: b.cover_path ? `${protocol}://${host}/uploads/${b.cover_path}` : null
      }))
    );
  } catch (e) {
    console.error('Ошибка получения битов beatmaker:', e);
    res.status(500).json({ error: 'Ошибка получения битов' });
  }
};

// Загрузить бит (beatmaker/admin)
exports.createBeat = async (req, res) => {
  const { title, genre, bpm, price } = req.body;
  const audioFile = req.files?.file?.[0];
  const coverFile = req.files?.cover?.[0];
  if (!audioFile) return res.status(400).json({ error: 'Файл бита обязателен' });
  if (!title || !genre || !bpm) return res.status(400).json({ error: 'title, genre, bpm обязательны' });

  try {
    const r = await query(
      "INSERT INTO beats (title, genre, bpm, price, cover_path, file_path, original_name, mime_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        String(title).trim(),
        String(genre).trim(),
        Number(bpm),
        price ? Number(price) : 0,
        coverFile ? coverFile.filename : null,
        audioFile.filename,
        audioFile.originalname,
        audioFile.mimetype,
        req.user.id
      ]
    );
    const beat = await queryOne(
      "SELECT id, title, genre, bpm, price, cover_path, file_path, created_at FROM beats WHERE id = ?",
      [r.insertId]
    );
    const host = req.get('host');
    const protocol = req.protocol;
    res.json({
      ...beat,
      file_url: `${protocol}://${host}/api/beats/${beat.id}/stream`,
      cover_url: beat.cover_path ? `${protocol}://${host}/uploads/${beat.cover_path}` : null
    });
  } catch (e) {
    console.error('Ошибка загрузки бита:', e);
    res.status(500).json({ error: 'Ошибка загрузки бита' });
  }
};

// Прослушивание (публично): стрим с Range
exports.streamBeat = async (req, res) => {
  try {
    const beat = await queryOne("SELECT id, file_path, mime_type FROM beats WHERE id = ?", [req.params.id]);
    if (!beat) return res.status(404).end();
    const abs = path.join(UPLOADS_DIR, beat.file_path);
    if (!fs.existsSync(abs)) return res.status(404).end();

    const stat = fs.statSync(abs);
    const range = req.headers.range;
    const mime = beat.mime_type || 'audio/mpeg';

    if (!range) {
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Accept-Ranges', 'bytes');
      return fs.createReadStream(abs).pipe(res);
    }

    const m = /bytes=(\d+)-(\d+)?/.exec(range);
    if (!m) {
      res.status(416).end();
      return;
    }
    const start = Number(m[1]);
    const end = m[2] ? Number(m[2]) : stat.size - 1;
    if (start >= stat.size) {
      res.status(416).end();
      return;
    }

    res.status(206);
    res.setHeader('Content-Type', mime);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', end - start + 1);
    fs.createReadStream(abs, { start, end }).pipe(res);
  } catch (e) {
    console.error('Ошибка stream бита:', e);
    res.status(500).end();
  }
};

// Скачать (только после покупки)
exports.downloadBeat = async (req, res) => {
  try {
    const beat = await queryOne(
      "SELECT id, title, file_path, original_name, mime_type, created_by, price FROM beats WHERE id = ?",
      [req.params.id]
    );
    if (!beat) return res.status(404).json({ error: 'Бит не найден' });

    const isAdminUser = req.user.role === 'admin';
    const isOwnerBeatmaker = req.user.role === 'beatmaker' && Number(beat.created_by) === Number(req.user.id);
    if (!isAdminUser && !isOwnerBeatmaker && Number(beat.price) > 0) {
      const p = await queryOne(
        "SELECT id FROM beat_purchases WHERE user_id = ? AND beat_id = ? AND status = 'paid'",
        [req.user.id, beat.id]
      );
      if (!p) return res.status(403).json({ error: 'Скачивание доступно только после покупки' });
    }

    const abs = path.join(UPLOADS_DIR, beat.file_path);
    const downloadName = (beat.original_name || `${beat.title}.mp3`).replace(/[\\/:*?"<>|]/g, '_');
    if (!fs.existsSync(abs)) return res.status(404).json({ error: 'Файл не найден' });

    res.setHeader('Content-Type', beat.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    fs.createReadStream(abs).pipe(res);
  } catch (e) {
    console.error('Ошибка скачивания бита:', e);
    res.status(500).json({ error: 'Ошибка скачивания' });
  }
};

// Обновить бит (beatmaker/admin)
exports.updateBeat = async (req, res) => {
  const { title, genre, bpm, price } = req.body;
  try {
    const beat = await queryOne("SELECT * FROM beats WHERE id = ?", [req.params.id]);
    if (!beat) return res.status(404).json({ error: 'Бит не найден' });
    if (req.user.role !== 'admin' && beat.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому биту' });
    }

    await query(
      "UPDATE beats SET title = ?, genre = ?, bpm = ?, price = ? WHERE id = ?",
      [
        title ?? beat.title,
        genre ?? beat.genre,
        bpm ? Number(bpm) : beat.bpm,
        price != null ? Number(price) : beat.price,
        beat.id
      ]
    );
    res.json({ message: 'Обновлено' });
  } catch (e) {
    console.error('Ошибка обновления бита:', e);
    res.status(500).json({ error: 'Ошибка обновления бита' });
  }
};

// Удалить бит (beatmaker/admin)
exports.deleteBeat = async (req, res) => {
  try {
    const beat = await queryOne("SELECT id, created_by, file_path, cover_path FROM beats WHERE id = ?", [req.params.id]);
    if (!beat) return res.status(404).json({ error: 'Бит не найден' });
    
    if (beat.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    await query("DELETE FROM beats WHERE id = ?", [req.params.id]);
    
    // Удалить файлы
    if (beat.file_path) {
      const filePath = path.join(UPLOADS_DIR, beat.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    if (beat.cover_path) {
      const coverPath = path.join(UPLOADS_DIR, beat.cover_path);
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    }

    res.json({ message: 'Бит удален' });
  } catch (e) {
    console.error('Ошибка удаления бита:', e);
    res.status(500).json({ error: 'Ошибка удаления бита' });
  }
};
