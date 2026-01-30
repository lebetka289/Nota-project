const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');
const { authenticateToken } = require('../middlewares/auth');
const { upload } = require('../utils/upload');

// Публичные маршруты
router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);

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
