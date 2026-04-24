const roundCurrency = (value) => {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

const calculateItemsSummary = (items = []) => {
    const normalizedItems = items.map((item) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const subtotal = roundCurrency(quantity * price);

        return {
            ...item,
            quantity,
            price,
            subtotal
        };
    });

    const subtotal = roundCurrency(
        normalizedItems.reduce((sum, item) => sum + item.subtotal, 0)
    );

    return {
        items: normalizedItems,
        subtotal
    };
};

const applyVoucherDiscount = (voucher, subtotal) => {
    if (!voucher) {
        return {
            discount: 0,
            voucherCode: null
        };
    }

    if (voucher.minOrderValue && subtotal < voucher.minOrderValue) {
        throw new Error('Order total does not meet voucher minimum amount');
    }

    let discount = 0;
    if (voucher.discountType === 'percent') {
        discount = (subtotal * voucher.discountValue) / 100;
        if (voucher.maxDiscount) {
            discount = Math.min(discount, voucher.maxDiscount);
        }
    } else {
        discount = voucher.discountValue;
    }

    discount = roundCurrency(Math.min(discount, subtotal));

    return {
        discount,
        voucherCode: voucher.code
    };
};

module.exports = {
    roundCurrency,
    calculateItemsSummary,
    applyVoucherDiscount
};
