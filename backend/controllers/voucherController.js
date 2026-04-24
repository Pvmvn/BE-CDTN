const Voucher = require('../model/VoucherModel');
const { applyVoucherDiscount } = require('../helpers/pricing');

exports.getActiveVouchers = async (req, res) => {
    try {
        const now = new Date();
        const vouchers = await Voucher.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort('-createdAt');

        res.status(200).json({ success: true, count: vouchers.length, data: vouchers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createVoucher = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            code: String(req.body.code || '').toUpperCase()
        };

        const voucher = await Voucher.create(payload);
        res.status(201).json({ success: true, data: voucher });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateVoucher = async (req, res) => {
    try {
        const payload = {
            ...req.body
        };

        if (payload.code) {
            payload.code = String(payload.code).toUpperCase();
        }

        const voucher = await Voucher.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true
        });

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        res.status(200).json({ success: true, data: voucher });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        await voucher.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.validateVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findOne({
            code: String(req.params.code).toUpperCase(),
            isActive: true
        });

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        const now = new Date();
        if (voucher.startDate > now || voucher.endDate < now) {
            return res.status(400).json({ success: false, message: 'Voucher is not active' });
        }

        const subtotal = Number(req.query.subtotal || 0);
        const result = applyVoucherDiscount(voucher, subtotal);

        res.status(200).json({
            success: true,
            data: {
                voucher,
                subtotal,
                discountAmount: result.discount
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
