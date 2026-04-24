const express = require('express');
const {
    createContactMessage,
    getContactMessages,
    updateContactStatus
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', createContactMessage);
router.get('/', protect, authorize('admin', 'staff'), getContactMessages);
router.put('/:id', protect, authorize('admin', 'staff'), updateContactStatus);

module.exports = router;
