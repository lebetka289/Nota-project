const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticateToken } = require('../middlewares/auth');

router.get('/discount-info', authenticateToken, paymentsController.getUserDiscountInfo);
router.post('/yookassa/create', authenticateToken, paymentsController.createRecordingPayment);
router.post('/beat/pay', authenticateToken, paymentsController.paySingleBeat);
router.post('/yookassa/webhook', paymentsController.yookassaWebhook);

module.exports = router;
