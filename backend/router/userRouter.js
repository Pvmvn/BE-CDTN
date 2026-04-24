const express = require('express');
const {
    getAllUsers,
    getStaffUsers,
    getUserProfile,
    updateUserProfile,
    updateUserRole
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateUserProfile);
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/staff', protect, authorize('admin'), getStaffUsers);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);

module.exports = router;
