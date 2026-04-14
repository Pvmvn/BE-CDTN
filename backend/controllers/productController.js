const Product = require('../model/Product');

// @desc    Lấy danh sách sản phẩm (Có tìm kiếm, phân trang, lọc)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude from direct match
        const removeFields = ['select', 'sort', 'page', 'limit', 'keyword', 'minPrice', 'maxPrice'];
        removeFields.forEach(param => delete reqQuery[param]);

        // Tạo query object cơ bản
        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
        query = Product.find(JSON.parse(queryStr)).populate({
            path: 'category',
            select: 'name'
        });

        // Chỉ lấy sản phẩm còn bán trừ phi có yêu cầu đặc biệt
        query.where({ isAvailable: true });

        // TÌM KIẾM (Search)
        if (req.query.keyword) {
            const keyword = {
                name: {
                    $regex: req.query.keyword,
                    $options: 'i' // không phân biệt hoa thường
                }
            };
            query = query.find({ ...keyword });
        }

        // LỌC GIÁ (Filter Price)
        if (req.query.minPrice || req.query.maxPrice) {
            let priceFilter = {};
            if (req.query.minPrice) priceFilter.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) priceFilter.$lte = Number(req.query.maxPrice);
            query = query.find({ price: priceFilter });
        }

        // SẮP XẾP (Sort)
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // PHÂN TRANG (Pagination)
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Product.countDocuments(query);

        query = query.skip(startIndex).limit(limit);

        // Chạy query
        const products = await query;

        // Phản hồi kết quả pagination
        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.status(200).json({
            success: true,
            count: products.length,
            pagination,
            data: products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
// @access  Private (Admin/Staff)
exports.createProduct = async (req, res) => {
    try {
        const productData = req.body;

        // Nếu có upload ảnh từ multer, file_url sẽ nằm trong req.file.path
        if (req.file) {
            productData.image = req.file.path;
        }

        const product = await Product.create(productData);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Xem chi tiết 1 sản phẩm
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cập nhật thông tin sản phẩm
// @route   PUT /api/products/:id
// @access  Private (Admin/Staff)
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const updateData = req.body;
        // Nếu tải lên ảnh mới
        if (req.file) {
            updateData.image = req.file.path;
        }

        product = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Xoá mềm sản phẩm (Ngừng bán)
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        // Thực hiện Xoá mềm (Soft Delete) - Ẩn khỏi trang khách
        product.isAvailable = false;
        await product.save();

        res.status(200).json({ success: true, message: 'Đã tạm ngừng bán sản phẩm thành công', data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
