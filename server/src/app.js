const express = require('express');
const cors = require('cors');
const path = require('path');
const { UPLOADS_DIR } = require('./utils/upload');

const authRoutes = require('./routes/auth.routes');
const beatsRoutes = require('./routes/beats.routes');
const chatRoutes = require('./routes/chat.routes');
const recordingsRoutes = require('./routes/recordings.routes');
const paymentsRoutes = require('./routes/payments.routes');
const cartRoutes = require('./routes/cart.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const adminRoutes = require('./routes/admin.routes');
const productsRoutes = require('./routes/products.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const usersRoutes = require('./routes/users.routes');
const itemsRoutes = require('./routes/items.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Статические файлы (только изображения, аудио запрещено)
app.use('/uploads', (req, res, next) => {
  if (/\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(req.path || '')) {
    return res.status(403).end('Forbidden');
  }
  next();
});
app.use('/uploads', express.static(UPLOADS_DIR));

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/beats', beatsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/recordings', recordingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/health', healthRoutes);

module.exports = app;
