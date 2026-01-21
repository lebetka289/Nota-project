const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');

router.get('/:id', usersController.getPublicProfile);
router.get('/:id/recordings', usersController.getUserRecordings);
router.get('/:id/purchases', usersController.getUserPurchases);

module.exports = router;
