const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', reviewsController.getReviews);
router.post('/', authenticateToken, reviewsController.createReview);

module.exports = router;
