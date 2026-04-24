const express = require('express');
const {
    createOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelMyOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/my-orders', getMyOrders);
router.post('/', createOrder);
router.get('/', authorize('admin', 'staff'), getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', authorize('admin', 'staff'), updateOrderStatus);
router.put('/:id/cancel', cancelMyOrder);

module.exports = router;
