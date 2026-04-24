const Cart = require('../model/CartModel');
const Order = require('../model/OrderModel');
const Product = require('../model/ProductModel');
const Reservation = require('../model/ReservationModel');
const Voucher = require('../model/VoucherModel');
const { calculateItemsSummary, applyVoucherDiscount, roundCurrency } = require('../helpers/pricing');

const isStaffRole = (role) => ['admin', 'staff'].includes(role);

const buildOrderItemsFromInput = async (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
        return [];
    }

    const orderItems = await Promise.all(
        items.map(async (item) => {
            const productId = item.product || item.productId;
            const quantity = Number(item.quantity || 0);
            const product = await Product.findById(productId);

            if (!product || !product.isAvailable) {
                throw new Error(`Product not found or unavailable: ${productId}`);
            }

            if (quantity < 1) {
                throw new Error('Quantity must be at least 1');
            }

            return {
                product: product._id,
                name: product.name,
                price: product.price,
                quantity,
                image: product.image,
                note: item.note || ''
            };
        })
    );

    return orderItems;
};

const findValidVoucher = async (voucherCode, subtotal) => {
    if (!voucherCode) {
        return null;
    }

    const voucher = await Voucher.findOne({
        code: voucherCode.toUpperCase(),
        isActive: true
    });

    if (!voucher) {
        throw new Error('Voucher not found');
    }

    const now = new Date();
    if (voucher.startDate > now || voucher.endDate < now) {
        throw new Error('Voucher is not active');
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
        throw new Error('Voucher usage limit reached');
    }

    applyVoucherDiscount(voucher, subtotal);
    return voucher;
};

exports.createOrder = async (req, res) => {
    try {
        const {
            items,
            orderType = 'pickup',
            paymentMethod = 'cash',
            voucherCode,
            reservationId,
            note = '',
            useCart = false
        } = req.body;

        let sourceItems = [];
        if (useCart) {
            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ success: false, message: 'Cart is empty' });
            }
            sourceItems = cart.items.map((item) => ({
                product: item.product,
                quantity: item.quantity,
                note: item.note
            }));
        } else {
            sourceItems = items;
        }

        const orderItems = await buildOrderItemsFromInput(sourceItems);
        if (!orderItems.length) {
            return res.status(400).json({ success: false, message: 'Order items are required' });
        }

        const summary = calculateItemsSummary(orderItems);
        const voucher = await findValidVoucher(voucherCode, summary.subtotal);
        const voucherResult = applyVoucherDiscount(voucher, summary.subtotal);

        let reservation = null;
        if (reservationId) {
            reservation = await Reservation.findById(reservationId);
            if (!reservation) {
                return res.status(404).json({ success: false, message: 'Reservation not found' });
            }
            if (reservation.user && reservation.user.toString() !== req.user.id && !isStaffRole(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Not allowed to use this reservation' });
            }
        }

        const totalAmount = roundCurrency(summary.subtotal - voucherResult.discount);

        const order = await Order.create({
            user: req.user.id,
            items: summary.items,
            orderType,
            paymentMethod,
            reservation: reservation ? reservation._id : null,
            note,
            subtotalAmount: summary.subtotal,
            discountAmount: voucherResult.discount,
            totalAmount,
            voucherCode: voucherResult.voucherCode
        });

        if (voucher) {
            voucher.usedCount += 1;
            await voucher.save();
        }

        if (useCart) {
            await Cart.findOneAndUpdate(
                { user: req.user.id },
                { $set: { items: [], totalAmount: 0 } }
            );
        }

        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email phone')
            .populate('reservation');

        res.status(201).json({ success: true, data: populatedOrder });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('reservation')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email phone role')
            .populate('reservation')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone role')
            .populate('reservation');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!isStaffRole(req.user.role) && order.user._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not allowed to access this order' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, cancelReason = '' } = req.body;
        const validStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
        if (status === 'cancelled') {
            order.cancelledAt = new Date();
            order.cancelReason = cancelReason || order.cancelReason;
        }
        await order.save();

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.cancelMyOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!isStaffRole(req.user.role) && order.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not allowed to cancel this order' });
        }

        if (['completed', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Order can no longer be cancelled' });
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelReason = req.body.cancelReason || 'Cancelled by user';
        await order.save();

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
