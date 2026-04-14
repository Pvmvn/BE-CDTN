const jwt = require('jsonwebtoken');
const User = require('../model/User');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Không có quyền truy cập, không tìm thấy người dùng' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Không có quyền truy cập, token không hợp lệ' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Không có quyền truy cập, không có token' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Không có quyền truy cập, thiếu thông tin người dùng' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Vai trò ${req.user.role} không có quyền truy cập route này`
            });
        }
        next();
    };
};
