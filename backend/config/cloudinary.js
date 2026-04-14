const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình storage cho multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cafe_products', // Tên folder trên Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;
