const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const paymentsController = require('../controllers/payments.controller');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, cartController.getCart);
router.post('/', authenticateToken, cartController.addToCart);
router.post('/checkout', authenticateToken, paymentsController.createCartPayment);
router.delete('/:id', authenticateToken, cartController.removeFromCart);
router.delete('/', authenticateToken, cartController.clearCart);

module.exports = router;
