const express = require('express');
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(getCategories)
    .post(protect, authorize('admin', 'staff'), createCategory);

router.route('/:id')
    .put(protect, authorize('admin', 'staff'), updateCategory)
    .delete(protect, authorize('admin'), deleteCategory);

module.exports = router;
