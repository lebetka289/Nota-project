const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticateToken } = require('../middlewares/auth');

router.post('/yookassa/create', authenticateToken, paymentsController.createRecordingPayment);
router.post('/yookassa/webhook', paymentsController.yookassaWebhook);

module.exports = router;
