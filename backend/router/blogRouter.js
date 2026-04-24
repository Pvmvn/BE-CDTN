const express = require('express');
const {
    getPublishedBlogs,
    getAdminBlogs,
    getBlogByIdOrSlug,
    createBlog,
    updateBlog,
    deleteBlog
} = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/authMiddleware');
const uploadCloud = require('../config/cloudinary');

const router = express.Router();

router.get('/', getPublishedBlogs);
router.get('/admin/all', protect, authorize('admin', 'staff'), getAdminBlogs);
router.get('/:idOrSlug', getBlogByIdOrSlug);
router.post(
    '/',
    protect,
    authorize('admin', 'staff'),
    uploadCloud.single('image'),
    createBlog
);
router.put(
    '/:id',
    protect,
    authorize('admin', 'staff'),
    uploadCloud.single('image'),
    updateBlog
);
router.delete('/:id', protect, authorize('admin', 'staff'), deleteBlog);

module.exports = router;
