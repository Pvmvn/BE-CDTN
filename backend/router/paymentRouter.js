const express = require('express');
const {
    createVNPayPaymentUrl,
    handleVNPayReturn,
    markOrderAsPaid
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/vnpay/return', handleVNPayReturn);
router.post('/orders/:id/vnpay-url', protect, createVNPayPaymentUrl);
router.put('/orders/:id/mark-paid', protect, authorize('admin', 'staff'), markOrderAsPaid);

module.exports = router;
