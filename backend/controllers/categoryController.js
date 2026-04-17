const Category = require('../model/CategoryModel.js');

// @desc    Lấy tất cả danh mục
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Tạo danh mục mới
// @route   POST /api/categories
// @access  Private (Admin/Staff)
exports.createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Cập nhật danh mục
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Xóa danh mục
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        await category.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
