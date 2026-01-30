const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticateToken } = require('../middlewares/auth');
const { upload } = require('../utils/upload');

router.post('/me/avatar', authenticateToken, upload.single('avatar'), usersController.uploadAvatar);
router.get('/:id', usersController.getPublicProfile);
router.get('/:id/recordings', usersController.getUserRecordings);
router.get('/:id/purchases', usersController.getUserPurchases);
router.get('/:id/purchases/pending', authenticateToken, usersController.getUserPendingPurchases);

module.exports = router;
