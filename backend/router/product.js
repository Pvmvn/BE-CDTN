const express = require('express');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const { protect, authorize } = require('../middleware/authMiddleware');
const uploadCloud = require('../config/cloudinary');

const router = express.Router();

router.route('/')
    .get(getProducts)
    // Dùng multer uploadCloud.single('image') để đón file hình gửi lên
    .post(protect, authorize('admin', 'staff'), uploadCloud.single('image'), createProduct);

router.route('/:id')
    .get(getProduct)
    .put(protect, authorize('admin', 'staff'), uploadCloud.single('image'), updateProduct)
    .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;
