const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên sản phẩm'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Vui lòng nhập mô tả sản phẩm']
    },
    price: {
        type: Number,
        required: [true, 'Vui lòng nhập giá sản phẩm'],
        min: [0, 'Giá sản phẩm không được nhỏ hơn 0']
    },
    image: {
        type: String,
        default: 'no-image.jpg'
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: [true, 'Vui lòng chọn danh mục cho sản phẩm']
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
