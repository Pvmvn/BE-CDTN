const User = require('../model/UserModel');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort('-createdAt');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStaffUsers = async (req, res) => {
    try {
        const staffUsers = await User.find({ role: 'staff' }).select('-password').sort('-createdAt');
        res.status(200).json({ success: true, count: staffUsers.length, data: staffUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { name, email, phone, address, avatar, password } = req.body;

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            user.email = email;
        }

        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        if (avatar !== undefined) user.avatar = avatar;
        if (password) user.password = password;

        await user.save();

        const profile = await User.findById(user._id).select('-password');
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const validRoles = ['customer', 'staff', 'admin'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role value' });
        }

        const currentUser = await User.findById(id);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (currentUser.role === 'admin' && role !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount === 1) {
                return res.status(400).json({
                    success: false,
                    message: 'System must keep at least one admin'
                });
            }
        }

        currentUser.role = role;
        await currentUser.save();

        const updatedUser = await User.findById(id).select('-password');
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
