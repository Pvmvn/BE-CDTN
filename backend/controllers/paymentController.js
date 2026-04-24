const crypto = require('crypto');
const Order = require('../model/OrderModel');
const { createVNPayTxnRef, formatDateVNPay } = require('../utils/dateVnpay');

const sortObject = (payload) => {
    return Object.keys(payload)
        .sort()
        .reduce((result, key) => {
            result[key] = payload[key];
            return result;
        }, {});
};

const buildQueryString = (payload) => {
    return new URLSearchParams(sortObject(payload)).toString();
};

const canAccessOrder = (order, user) => {
    if (!order || !user) {
        return false;
    }
    return ['admin', 'staff'].includes(user.role) || order.user.toString() === user.id;
};

exports.createVNPayPaymentUrl = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!canAccessOrder(order, req.user)) {
            return res.status(403).json({ success: false, message: 'Not allowed to pay for this order' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: 'Order is already paid' });
        }

        const requiredEnv = ['VNPAY_URL', 'VNPAY_RETURN_URL', 'VNPAY_TMNCODE', 'VNPAY_HASH_SECRET'];
        const missingEnv = requiredEnv.filter((key) => !process.env[key]);
        if (missingEnv.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing VNPay configuration: ${missingEnv.join(', ')}`
            });
        }

        const txnRef = createVNPayTxnRef(order.orderNumber.replace(/[^A-Za-z0-9]/g, ''));
        const vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: process.env.VNPAY_TMNCODE,
            vnp_Locale: req.body.locale || 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`,
            vnp_OrderType: 'other',
            vnp_Amount: Math.round(Number(order.totalAmount) * 100),
            vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
            vnp_IpAddr: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
            vnp_CreateDate: formatDateVNPay(new Date())
        };

        if (req.body.bankCode) {
            vnpParams.vnp_BankCode = req.body.bankCode;
        }

        const signData = buildQueryString(vnpParams);
        const secureHash = crypto
            .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
            .update(Buffer.from(signData, 'utf8'))
            .digest('hex');

        order.paymentMethod = 'vnpay';
        order.paymentGateway = 'vnpay';
        order.transactionRef = txnRef;
        await order.save();

        const paymentUrl = `${process.env.VNPAY_URL}?${signData}&vnp_SecureHash=${secureHash}`;

        res.status(200).json({
            success: true,
            data: {
                paymentUrl,
                transactionRef: txnRef,
                orderId: order._id,
                orderNumber: order.orderNumber
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.handleVNPayReturn = async (req, res) => {
    try {
        const payload = { ...req.query };
        const secureHash = payload.vnp_SecureHash;
        delete payload.vnp_SecureHash;
        delete payload.vnp_SecureHashType;

        if (process.env.VNPAY_HASH_SECRET) {
            const signData = buildQueryString(payload);
            const signed = crypto
                .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
                .update(Buffer.from(signData, 'utf8'))
                .digest('hex');

            if (signed !== secureHash) {
                return res.status(400).json({ success: false, message: 'Invalid VNPay signature' });
            }
        }

        const order = await Order.findOne({ transactionRef: payload.vnp_TxnRef });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found for transaction' });
        }

        if (payload.vnp_ResponseCode === '00') {
            order.paymentStatus = 'paid';
            order.paidAt = new Date();
            if (order.status === 'pending') {
                order.status = 'confirmed';
            }
        } else {
            order.paymentStatus = 'failed';
        }

        await order.save();

        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentStatus: order.paymentStatus,
                status: order.status,
                responseCode: payload.vnp_ResponseCode
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markOrderAsPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        if (order.status === 'pending') {
            order.status = 'confirmed';
        }
        await order.save();

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
