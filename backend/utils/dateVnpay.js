const pad = (value) => String(value).padStart(2, '0');

const formatDateVNPay = (date = new Date()) => {
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate()),
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds())
    ].join('');
};

const createVNPayTxnRef = (prefix = 'ORD') => {
    return `${prefix}${Date.now()}`;
};

module.exports = {
    formatDateVNPay,
    createVNPayTxnRef
};
