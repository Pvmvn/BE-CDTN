const express = require('express');
const {
    getActiveVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    validateVoucher
} = require('../controllers/voucherController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getActiveVouchers);
router.get('/validate/:code', validateVoucher);
router.post('/', protect, authorize('admin', 'staff'), createVoucher);
router.put('/:id', protect, authorize('admin', 'staff'), updateVoucher);
router.delete('/:id', protect, authorize('admin'), deleteVoucher);

module.exports = router;
