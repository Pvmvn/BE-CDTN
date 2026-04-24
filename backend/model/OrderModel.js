const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        image: {
            type: String,
            default: ''
        },
        note: {
            type: String,
            trim: true,
            default: ''
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true,
            index: true
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        },
        items: {
            type: [orderItemSchema],
            validate: {
                validator: (value) => Array.isArray(value) && value.length > 0,
                message: 'Order must have at least one item'
            }
        },
        orderType: {
            type: String,
            enum: ['pickup', 'delivery', 'dine_in'],
            default: 'pickup'
        },
        reservation: {
            type: mongoose.Schema.ObjectId,
            ref: 'Reservation',
            default: null
        },
        note: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'],
            default: 'pending'
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'vnpay'],
            default: 'cash'
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'failed', 'refunded'],
            default: 'unpaid'
        },
        paymentGateway: {
            type: String,
            trim: true,
            default: ''
        },
        transactionRef: {
            type: String,
            trim: true,
            default: ''
        },
        subtotalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        voucherCode: {
            type: String,
            trim: true,
            default: null
        },
        paidAt: {
            type: Date,
            default: null
        },
        cancelledAt: {
            type: Date,
            default: null
        },
        cancelReason: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

orderSchema.pre('save', function(next) {
    if (!this.orderNumber) {
        this.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
