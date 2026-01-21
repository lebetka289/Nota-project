const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/items.controller');

router.get('/', itemsController.getItems);
router.post('/', itemsController.createItem);

module.exports = router;
