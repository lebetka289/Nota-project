const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

router.get('/', productsController.getProducts);
router.get('/:id', productsController.getProduct);
router.post('/', authenticateToken, isAdmin, productsController.createProduct);
router.put('/:id', authenticateToken, isAdmin, productsController.updateProduct);
router.delete('/:id', authenticateToken, isAdmin, productsController.deleteProduct);

module.exports = router;
