const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');
const { authenticateToken, optionalAuthenticateToken } = require('../middlewares/auth');
const { upload } = require('../utils/upload');

// Публичные маршруты (GET / с опциональным токеном для user_has_liked)
router.get('/', optionalAuthenticateToken, newsController.getAllNews);
router.get('/:id/comments', newsController.getComments);
router.get('/:id/like-state', authenticateToken, newsController.getNewsLikesState);
router.get('/:id', newsController.getNewsById);
router.post('/:id/view', newsController.incrementView);

// Лайки и комментарии (требуется авторизация)
router.post('/:id/likes', authenticateToken, newsController.toggleLike);
router.post('/:id/comments', authenticateToken, newsController.addComment);

// Защищенные маршруты (репортер/админ)
const isReporterOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'reporter') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуется роль репортера или администратора' });
  }
  next();
};

router.get('/admin/all', authenticateToken, isReporterOrAdmin, newsController.getAllNewsAdmin);
router.post('/upload-image', authenticateToken, isReporterOrAdmin, upload.single('image'), newsController.uploadImage);
router.post('/', authenticateToken, isReporterOrAdmin, newsController.createNews);
router.put('/:id', authenticateToken, isReporterOrAdmin, newsController.updateNews);
router.delete('/:id', authenticateToken, isReporterOrAdmin, newsController.deleteNews);

module.exports = router;
