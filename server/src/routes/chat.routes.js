const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticateToken, isSupportOrAdmin } = require('../middlewares/auth');

router.post('/conversations/me', authenticateToken, chatController.getOrCreateMyConversation);
router.get('/conversations/me/messages', authenticateToken, chatController.getMyMessages);
router.post('/conversations/me/messages', authenticateToken, chatController.sendMyMessage);
router.get('/conversations', authenticateToken, isSupportOrAdmin, chatController.getAllConversations);
router.get('/conversations/:id/messages', authenticateToken, isSupportOrAdmin, chatController.getConversationMessages);
router.post('/conversations/:id/messages', authenticateToken, isSupportOrAdmin, chatController.sendMessageToConversation);

module.exports = router;
