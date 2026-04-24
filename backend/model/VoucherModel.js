const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        discountType: {
            type: String,
            enum: ['percent', 'fixed'],
            required: true
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0
        },
        minOrderValue: {
            type: Number,
            default: 0,
            min: 0
        },
        maxDiscount: {
            type: Number,
            default: 0,
            min: 0
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        usageLimit: {
            type: Number,
            default: 0,
            min: 0
        },
        usedCount: {
            type: Number,
            default: 0,
            min: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Voucher', voucherSchema);
