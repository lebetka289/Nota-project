const { query, queryOne } = require('../../config/database');

function validateBody(body) {
  const {
    firstName,
    lastName,
    phone,
    email,
    musicGenre,
    songsCount,
    dateStart,
    dateEnd,
    hasMusicians,
    needSessionMusicians,
    needProducer,
    needEngineer
  } = body;

  if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
    return 'Укажите имя';
  }
  if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
    return 'Укажите фамилию';
  }
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return 'Укажите телефон';
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    return 'Укажите email';
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return 'Некорректный email';
  }
  if (!musicGenre || typeof musicGenre !== 'string' || !musicGenre.trim()) {
    return 'Выберите жанр музыки';
  }
  const count = Number(songsCount);
  if (!Number.isInteger(count) || count < 1) {
    return 'Укажите количество песен (не менее 1)';
  }
  if (!dateStart || typeof dateStart !== 'string' || !dateStart.trim()) {
    return 'Укажите дату начала';
  }
  if (!dateEnd || typeof dateEnd !== 'string' || !dateEnd.trim()) {
    return 'Укажите дату окончания';
  }
  if (new Date(dateEnd) < new Date(dateStart)) {
    return 'Дата окончания не может быть раньше даты начала';
  }
  if (typeof hasMusicians !== 'boolean') {
    return 'Ответьте: есть ли музыканты или группа';
  }
  if (typeof needSessionMusicians !== 'boolean') {
    return 'Ответьте: нужны ли сессионные музыканты';
  }
  if (typeof needProducer !== 'boolean') {
    return 'Ответьте: нужен ли продюсер';
  }
  if (typeof needEngineer !== 'boolean') {
    return 'Ответьте: нужен ли звукорежиссёр';
  }
  return null;
}

exports.submitBooking = async (req, res) => {
  const body = req.body || {};
  const err = validateBody(body);
  if (err) {
    return res.status(400).json({ error: err, message: err });
  }

  try {
    const firstName = String(body.firstName).trim();
    const lastName = String(body.lastName).trim();
    const phone = String(body.phone).trim();
    const email = String(body.email).trim();
    const intlPrefix = body.intlPrefix ? String(body.intlPrefix).trim() : null;
    const website = body.website ? String(body.website).trim() : null;
    const musicGenre = String(body.musicGenre).trim();
    const songsCount = Number(body.songsCount);
    const musicDetails = body.musicDetails ? String(body.musicDetails).trim() : null;
    const dateStart = String(body.dateStart).trim();
    const dateEnd = String(body.dateEnd).trim();
    const hasMusicians = Boolean(body.hasMusicians);
    const needSessionMusicians = Boolean(body.needSessionMusicians);
    const needProducer = Boolean(body.needProducer);
    const needEngineer = Boolean(body.needEngineer);
    const additionalInfo = body.additionalInfo ? String(body.additionalInfo).trim() : null;

    await query(
      `INSERT INTO studio_bookings (
        first_name, last_name, phone, email, intl_prefix, website,
        music_genre, songs_count, music_details, date_start, date_end,
        has_musicians, need_session_musicians, need_producer, need_engineer,
        additional_info, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
      [
        firstName,
        lastName,
        phone,
        email,
        intlPrefix,
        website,
        musicGenre,
        songsCount,
        musicDetails,
        dateStart,
        dateEnd,
        hasMusicians ? 1 : 0,
        needSessionMusicians ? 1 : 0,
        needProducer ? 1 : 0,
        needEngineer ? 1 : 0,
        additionalInfo
      ]
    );

    return res.status(200).json({ success: true, message: 'Заявка принята' });
  } catch (dbError) {
    if (dbError.code === 'ER_NO_SUCH_TABLE') {
      console.warn('Таблица studio_bookings отсутствует. Добавьте её в database.service.js. Заявка принята без сохранения.');
      return res.status(200).json({ success: true, message: 'Заявка принята' });
    }
    console.error('Ошибка сохранения заявки на студию:', dbError);
    return res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось отправить заявку. Попробуйте позже.'
    });
  }
};

// Валидация для формы «запись с покупкой музыки» (без email и website)
function validateWithMusicBody(body) {
  const { firstName, lastName, phone, musicGenre, songsCount, dateStart, dateEnd, hasMusicians, needSessionMusicians, needProducer, needEngineer } = body;
  if (!firstName || typeof firstName !== 'string' || !firstName.trim()) return 'Укажите имя';
  if (!lastName || typeof lastName !== 'string' || !lastName.trim()) return 'Укажите фамилию';
  if (!phone || typeof phone !== 'string' || !phone.trim()) return 'Укажите телефон';
  if (!musicGenre || typeof musicGenre !== 'string' || !musicGenre.trim()) return 'Выберите жанр музыки';
  const count = Number(songsCount);
  if (!Number.isInteger(count) || count < 1) return 'Укажите количество песен (не менее 1)';
  if (!dateStart || typeof dateStart !== 'string' || !dateStart.trim()) return 'Укажите дату начала';
  if (!dateEnd || typeof dateEnd !== 'string' || !dateEnd.trim()) return 'Укажите дату окончания';
  if (new Date(dateEnd) < new Date(dateStart)) return 'Дата окончания не может быть раньше даты начала';
  if (typeof hasMusicians !== 'boolean') return 'Ответьте: есть ли музыканты или группа';
  if (typeof needSessionMusicians !== 'boolean') return 'Ответьте: нужны ли сессионные музыканты';
  if (typeof needProducer !== 'boolean') return 'Ответьте: нужен ли продюсер';
  if (typeof needEngineer !== 'boolean') return 'Ответьте: нужен ли звукорежиссёр';
  return null;
}

exports.submitWithMusicClarification = async (req, res) => {
  const body = req.body || {};
  const err = validateWithMusicBody(body);
  if (err) {
    return res.status(400).json({ error: err, message: err });
  }

  try {
    const firstName = String(body.firstName).trim();
    const lastName = String(body.lastName).trim();
    const phone = String(body.phone).trim();
    const intlPrefix = body.intlPrefix ? String(body.intlPrefix).trim() : null;
    const musicGenre = String(body.musicGenre).trim();
    const songsCount = Number(body.songsCount);
    const musicDetails = body.musicDetails ? String(body.musicDetails).trim() : null;
    const dateStart = String(body.dateStart).trim();
    const dateEnd = String(body.dateEnd).trim();
    const hasMusicians = Boolean(body.hasMusicians);
    const needSessionMusicians = Boolean(body.needSessionMusicians);
    const needProducer = Boolean(body.needProducer);
    const needEngineer = Boolean(body.needEngineer);
    const additionalInfo = body.additionalInfo ? String(body.additionalInfo).trim() : null;
    const beatId = body.beatId != null ? Number(body.beatId) : null;

    await query(
      `INSERT INTO studio_bookings (
        first_name, last_name, phone, email, intl_prefix, website,
        music_genre, songs_count, music_details, date_start, date_end,
        has_musicians, need_session_musicians, need_producer, need_engineer,
        additional_info, status, beat_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
      [
        firstName, lastName, phone, '', (intlPrefix || ''), null,
        musicGenre, songsCount, musicDetails, dateStart, dateEnd,
        hasMusicians ? 1 : 0, needSessionMusicians ? 1 : 0, needProducer ? 1 : 0, needEngineer ? 1 : 0,
        additionalInfo, beatId
      ]
    );
    const bookingId = (await queryOne('SELECT LAST_INSERT_ID() as id')).id;
    await query('UPDATE studio_bookings SET source = ? WHERE id = ?', ['with-music', bookingId]);

    return res.status(200).json({ success: true, message: 'Данные отправлены битмейкеру', bookingId });
  } catch (dbError) {
    if (dbError.code === 'ER_NO_SUCH_TABLE') {
      return res.status(200).json({ success: true, message: 'Данные приняты' });
    }
    console.error('Ошибка сохранения уточнения with-music:', dbError);
    return res.status(500).json({ error: 'Ошибка сервера', message: 'Не удалось отправить данные.' });
  }
};

// Список заявок для битмейкера: new и in_work
exports.getListForBeatmaker = async (req, res) => {
  try {
    const [newList, inWorkList] = await Promise.all([
      query(
        `SELECT id, first_name, last_name, phone, email, intl_prefix, website,
                music_genre, songs_count, music_details, date_start, date_end,
                has_musicians, need_session_musicians, need_producer, need_engineer,
                additional_info, created_at, status, beat_id
         FROM studio_bookings WHERE status = 'new' ORDER BY created_at DESC`
      ),
      query(
        `SELECT b.id, b.first_name, b.last_name, b.phone, b.email, b.intl_prefix, b.website,
                b.music_genre, b.songs_count, b.music_details, b.date_start, b.date_end,
                b.has_musicians, b.need_session_musicians, b.need_producer, b.need_engineer,
                b.additional_info, b.created_at, b.status, b.beat_id AS booking_beat_id,
                b.recording_id, r.track_file_path, u.email AS user_email,
                beat.id AS beat_id, beat.title AS beat_title, beat.original_name AS beat_original_name
         FROM studio_bookings b
         LEFT JOIN user_recordings r ON b.recording_id = r.id
         LEFT JOIN users u ON r.user_id = u.id
         LEFT JOIN beats beat ON b.beat_id = beat.id
         WHERE b.status = 'in_work'
         ORDER BY b.created_at DESC`
      )
    ]);

    const mapRow = (row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      email: row.email,
      intlPrefix: row.intl_prefix,
      website: row.website,
      musicGenre: row.music_genre,
      songsCount: row.songs_count,
      musicDetails: row.music_details,
      dateStart: row.date_start,
      dateEnd: row.date_end,
      hasMusicians: Boolean(row.has_musicians),
      needSessionMusicians: Boolean(row.need_session_musicians),
      needProducer: Boolean(row.need_producer),
      needEngineer: Boolean(row.need_engineer),
      additionalInfo: row.additional_info,
      createdAt: row.created_at,
      status: row.status || 'new'
    });

    const mapInWorkRow = (row) => ({
      ...mapRow(row),
      isPaid: Boolean(row.recording_id),
      recordingId: row.recording_id || null,
      userEmail: row.user_email || null,
      trackFilePath: row.track_file_path || null,
      beat: row.beat_id ? { id: row.beat_id, title: row.beat_title, originalName: row.beat_original_name } : null
    });

    res.json({
      new: newList.map(mapRow),
      in_work: inWorkList.map(mapInWorkRow)
    });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ new: [], in_work: [] });
    }
    console.error('Ошибка получения заявок студии:', err);
    res.status(500).json({ error: 'Ошибка получения заявок' });
  }
};

// Получить заявку по id для личного кабинета (если не привязана к пользователю или привязана к текущему)
exports.getBookingById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Некорректный id' });
  }
  try {
    const row = await queryOne(
      `SELECT b.id, b.first_name, b.last_name, b.phone, b.email, b.music_genre, b.songs_count,
              b.date_start, b.date_end, b.created_at, b.source, b.beat_id, b.recording_id, b.user_id
       FROM studio_bookings b
       WHERE b.id = ? AND (b.user_id IS NULL OR b.user_id = ?)`,
      [id, req.user.id]
    );
    if (!row) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    res.json({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      email: row.email,
      musicGenre: row.music_genre,
      songsCount: row.songs_count,
      dateStart: row.date_start,
      dateEnd: row.date_end,
      createdAt: row.created_at,
      source: row.source,
      beatId: row.beat_id,
      recordingId: row.recording_id,
      userId: row.user_id,
      isPaid: Boolean(row.recording_id)
    });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    console.error('Ошибка получения заявки:', err);
    res.status(500).json({ error: 'Ошибка получения заявки' });
  }
};

// Перевести заявку в работу или завершить (битмейкер)
exports.updateBookingStatus = async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Некорректный id' });
  }
  if (!['in_work', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'status должен быть in_work или completed' });
  }

  try {
    const row = await queryOne('SELECT id, status FROM studio_bookings WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    await query('UPDATE studio_bookings SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, status });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    console.error('Ошибка обновления заявки:', err);
    res.status(500).json({ error: 'Ошибка обновления заявки' });
  }
};
