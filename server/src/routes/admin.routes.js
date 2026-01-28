const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

router.get('/users', authenticateToken, isAdmin, adminController.getAllUsers);
router.put('/users/:id/role', authenticateToken, isAdmin, adminController.updateUserRole);
router.put('/users/:id/block', authenticateToken, isAdmin, adminController.updateUserBlock);
router.put('/users/:id/password', authenticateToken, isAdmin, adminController.updateUserPassword);
router.delete('/users/:id', authenticateToken, isAdmin, adminController.deleteUser);
router.get('/statistics', authenticateToken, isAdmin, adminController.getStatistics);

module.exports = router;
