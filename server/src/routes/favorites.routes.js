const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites.controller');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, favoritesController.getFavorites);
router.post('/', authenticateToken, favoritesController.addToFavorites);
router.delete('/:beat_id', authenticateToken, favoritesController.removeFromFavorites);
router.get('/check/:beat_id', authenticateToken, favoritesController.checkFavorite);

module.exports = router;
