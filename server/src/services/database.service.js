const { query, queryOne, testConnection, createDatabaseIfNotExists } = require('../../config/database');

async function initDatabase() {
  await createDatabaseIfNotExists();
  await testConnection();

  const ensureColumn = async (table, column, definition) => {
    const exists = await queryOne(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    if (!exists) {
      await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };

  // Таблица пользователей
  await query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    email_verified TINYINT(1) DEFAULT 0,
    verification_code VARCHAR(6) NULL,
    verification_code_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await ensureColumn('users', 'email_verified', "TINYINT(1) DEFAULT 0");
  await ensureColumn('users', 'verification_code', "VARCHAR(6) NULL");
  await ensureColumn('users', 'verification_code_expires', "TIMESTAMP NULL");
  await ensureColumn('users', 'blocked', "TINYINT(1) DEFAULT 0");
  await ensureColumn('users', 'avatar_path', "VARCHAR(255) NULL");
  await ensureColumn('users', 'used_50_discount', "TINYINT(1) DEFAULT 0");
  await ensureColumn('users', 'password_reset_token', "VARCHAR(255) NULL");
  await ensureColumn('users', 'password_reset_expires', "TIMESTAMP NULL");

  // Таблица товаров
  await query(`CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    sizes VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Таблица услуг
  await query(`CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    features TEXT,
    price DECIMAL(10, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Начальные товары
  const productCount = await queryOne("SELECT COUNT(*) as count FROM products");
  if (productCount.count === 0) {
    const initialProducts = [
      ['Футболка Nota Studio Classic', 'Классическая футболка с логотипом студии. 100% хлопок, премиальное качество.', 'tshirts', 'S,M,L,XL', 1990],
      ['Футболка Nota Studio Black', 'Черная футболка с минималистичным дизайном. Идеально для повседневной носки.', 'tshirts', 'S,M,L,XL,XXL', 2190],
      ['Футболка Nota Studio White', 'Белая футболка с контрастным принтом. Легкая и дышащая ткань.', 'tshirts', 'M,L,XL', 1990],
      ['Футболка Nota Studio Graphic', 'Футболка с графическим принтом. Оригинальный дизайн от студии.', 'tshirts', 'S,M,L', 2390],
      ['Футболка Nota Studio Vintage', 'Винтажная футболка с эффектом состаренности. Уникальный стиль.', 'tshirts', 'S,M,L,XL,XXL', 2590],
      ['Футболка Nota Studio Oversized', 'Оверсайз футболка свободного кроя. Комфорт и стиль.', 'tshirts', 'M,L,XL,XXL', 2290],
      ['Футболка Nota Studio Minimal', 'Минималистичная футболка без принтов. Элегантность в простоте.', 'tshirts', 'S,M,L,XL', 1890],
      ['Футболка Nota Studio Logo', 'Футболка с большим логотипом студии на груди. Заявляет о стиле.', 'tshirts', 'S,M,L,XL,XXL', 2490],
      ['Худи Nota Studio Premium', 'Премиальное худи из мягкого флиса. Капюшон с регулировкой, карманы-кенгуру.', 'hoodies', 'M,L,XL,XXL', 4990],
      ['Худи Nota Studio Oversized', 'Оверсайз худи свободного кроя. Удобный и стильный вариант для любого сезона.', 'hoodies', 'S,M,L,XL', 4590],
      ['Худи Nota Studio Zip', 'Худи на молнии с капюшоном. Практичный вариант для активного образа жизни.', 'hoodies', 'M,L,XL', 5290],
      ['Худи Nota Studio Minimal', 'Минималистичное худи без принтов. Классический стиль и комфорт.', 'hoodies', 'S,M,L,XL,XXL', 4790],
      ['Худи Nota Studio Graphic', 'Худи с ярким графическим принтом. Выделяйся из толпы.', 'hoodies', 'M,L,XL,XXL', 5490],
      ['Худи Nota Studio Black', 'Классическое черное худи. Универсальный вариант на все случаи.', 'hoodies', 'S,M,L,XL,XXL', 4890],
      ['Худи Nota Studio Grey', 'Серое худи в стиле минимализма. Идеально для городской жизни.', 'hoodies', 'M,L,XL', 4790],
      ['Худи Nota Studio Crop', 'Короткое худи с обрезанным низом. Современный тренд.', 'hoodies', 'S,M,L', 4690],
      ['Штаны Nota Studio Joggers', 'Джоггеры с эластичными манжетами. Идеальны для студии и повседневной носки.', 'pants', 'S,M,L,XL', 3990],
      ['Штаны Nota Studio Cargo', 'Карго штаны с множеством карманов. Функциональность и стиль в одном.', 'pants', 'M,L,XL,XXL', 4490],
      ['Штаны Nota Studio Classic', 'Классические штаны прямого кроя. Универсальный вариант для любого образа.', 'pants', 'S,M,L', 3790],
      ['Штаны Nota Studio Slim', 'Облегающие штаны зауженного кроя. Современный и элегантный силуэт.', 'pants', 'S,M,L,XL', 3890],
      ['Штаны Nota Studio Wide', 'Широкие штаны свободного кроя. Комфорт превыше всего.', 'pants', 'M,L,XL,XXL', 4190],
      ['Штаны Nota Studio Tapered', 'Штаны с сужением к низу. Трендовая модель.', 'pants', 'S,M,L,XL', 4090],
      ['Штаны Nota Studio Work', 'Рабочие штаны повышенной прочности. Для активного использования.', 'pants', 'M,L,XL,XXL', 4690],
      ['Штаны Nota Studio Chino', 'Штаны чино классического кроя. Деловой стиль.', 'pants', 'S,M,L,XL', 4290]
    ];

    for (const product of initialProducts) {
      await query(
        "INSERT INTO products (name, description, category, sizes, price) VALUES (?, ?, ?, ?, ?)",
        product
      );
    }
  }

  // Начальная услуга: съемка видеоклипа
  const videoClipService = await queryOne("SELECT id FROM services WHERE slug = ?", ['video-clip']);
  if (!videoClipService) {
    const features = JSON.stringify([
      'Память на всю жизнь',
      'Сценарий клипа',
      'Профессиональный видеоклип с записи песни',
      'Профессиональный свет'
    ]);
    await query(
      "INSERT INTO services (slug, title, description, features, price) VALUES (?, ?, ?, ?, ?)",
      [
        'video-clip',
        'Съёмка видеоклипа',
        'Снимаем клип по вашей истории или песне с полным продакшеном.',
        features,
        15000
      ]
    );
  }

  // Таблица корзины товаров
  await query(`CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    size VARCHAR(10),
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )`);

  // Таблица избранного товаров
  await query(`CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
  )`);

  // Таблица записей пользователей
  await query(`CREATE TABLE IF NOT EXISTS user_recordings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recording_type VARCHAR(50) NOT NULL,
    music_style VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    price DECIMAL(10, 2),
    track_file_path VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  await ensureColumn('user_recordings', 'payment_provider', "VARCHAR(50) NULL");
  await ensureColumn('user_recordings', 'payment_id', "VARCHAR(128) NULL");
  await ensureColumn('user_recordings', 'payment_status', "VARCHAR(50) NULL");
  await ensureColumn('user_recordings', 'paid_at', "TIMESTAMP NULL");
  await ensureColumn('user_recordings', 'track_file_path', "VARCHAR(255) NULL");
  await ensureColumn('user_recordings', 'purchased_beat_id', "INT NULL");
  await ensureColumn('user_recordings', 'purchased_beat_ids', 'JSON NULL');
  await ensureColumn('user_recordings', 'discount_percent', "DECIMAL(5, 2) DEFAULT 0");
  await ensureColumn('user_recordings', 'studio_booking_id', 'INT NULL');

  // Чат: диалоги
  await query(`CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    last_message_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_open (user_id, status)
  )`);

  // Чат: сообщения
  await query(`CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_user_id INT NULL,
    sender_role VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_by_user TINYINT(1) DEFAULT 0,
    read_by_support TINYINT(1) DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL
  )`);

  // Заявки на запись в студию (форма записи)
  await query(`CREATE TABLE IF NOT EXISTS studio_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    intl_prefix VARCHAR(20) NULL,
    website VARCHAR(500) NULL,
    music_genre VARCHAR(100) NOT NULL,
    songs_count INT NOT NULL,
    music_details TEXT NULL,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    has_musicians TINYINT(1) NOT NULL,
    need_session_musicians TINYINT(1) NOT NULL,
    need_producer TINYINT(1) NOT NULL,
    need_engineer TINYINT(1) NOT NULL,
    additional_info TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await ensureColumn('studio_bookings', 'status', "VARCHAR(50) DEFAULT 'new'");
  await ensureColumn('studio_bookings', 'source', "VARCHAR(50) DEFAULT 'form'");
  await ensureColumn('studio_bookings', 'beat_id', 'INT NULL');
  await ensureColumn('studio_bookings', 'beat_ids', 'JSON NULL');
  await ensureColumn('studio_bookings', 'user_id', 'INT NULL');
  await ensureColumn('studio_bookings', 'recording_id', 'INT NULL');

  // Биты (магазин)
  await query(`CREATE TABLE IF NOT EXISTS beats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    bpm INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cover_path VARCHAR(255) NULL,
    file_path VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NULL,
    mime_type VARCHAR(100) NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  )`);

  await ensureColumn('beats', 'cover_path', "VARCHAR(255) NULL");
  await ensureColumn('beats', 'play_count', "INT DEFAULT 0");

  // Покупки битов
  await query(`CREATE TABLE IF NOT EXISTS beat_purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    beat_id INT NOT NULL,
    payment_provider VARCHAR(50) NULL,
    payment_id VARCHAR(128) NULL,
    payment_status VARCHAR(50) NULL,
    status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (beat_id) REFERENCES beats(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_beat (user_id, beat_id),
    KEY idx_payment_id (payment_id)
  )`);

  // Корзина битов
  await query(`CREATE TABLE IF NOT EXISTS beat_cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    beat_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (beat_id) REFERENCES beats(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_beat (user_id, beat_id)
  )`);

  // Избранное битов
  await query(`CREATE TABLE IF NOT EXISTS beat_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    beat_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (beat_id) REFERENCES beats(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_beat (user_id, beat_id)
  )`);

  // Старая таблица items (для совместимости)
  await query(`CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255)
  )`);

  // Отзывы покупателей
  await query(`CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Новости
  await query(`CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500) NULL,
    author_id INT NOT NULL,
    published TINYINT(1) DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_published (published, published_at)
  )`);
  await ensureColumn('news', 'tags', 'TEXT NULL');
  await ensureColumn('news', 'view_count', 'INT NOT NULL DEFAULT 0');

  // Лайки новостей
  await query(`CREATE TABLE IF NOT EXISTS news_likes (
    news_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (news_id, user_id),
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Комментарии к новостям
  await query(`CREATE TABLE IF NOT EXISTS news_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    news_id INT NOT NULL,
    user_id INT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_news_comments (news_id)
  )`);
}

module.exports = { initDatabase };
