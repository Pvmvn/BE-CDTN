const express = require('express');
const {
    getMyCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/me', getMyCart);
router.post('/items', addItemToCart);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/clear', clearCart);

module.exports = router;
