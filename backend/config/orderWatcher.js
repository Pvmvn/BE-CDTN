const Order = require('../model/OrderModel');

const startOrderWatcher = () => {
    if (process.env.ENABLE_ORDER_WATCHER === 'false') {
        return null;
    }

    const intervalMs = Number(process.env.ORDER_WATCHER_INTERVAL_MS || 60000);
    const expirationMinutes = Number(process.env.ORDER_EXPIRATION_MINUTES || 30);

    return setInterval(async () => {
        try {
            const cutoff = new Date(Date.now() - expirationMinutes * 60 * 1000);
            await Order.updateMany(
                {
                    status: 'pending',
                    paymentStatus: 'unpaid',
                    createdAt: { $lte: cutoff }
                },
                {
                    $set: {
                        status: 'cancelled',
                        cancelledAt: new Date(),
                        cancelReason: 'Order expired before payment'
                    }
                }
            );
        } catch (error) {
            console.error('Order watcher error:', error.message);
        }
    }, intervalMs);
};

module.exports = startOrderWatcher;
