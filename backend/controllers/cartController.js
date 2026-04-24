const Cart = require('../model/CartModel');
const Product = require('../model/ProductModel');
const { roundCurrency } = require('../helpers/pricing');

const recalculateCart = (cart) => {
    cart.totalAmount = roundCurrency(
        cart.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
    );
};

const getOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({
            user: userId,
            items: [],
            totalAmount: 0
        });
    }
    return cart;
};

exports.getMyCart = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);
        await cart.populate('items.product', 'name price image category isAvailable');

        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addItemToCart = async (req, res) => {
    try {
        const { productId, quantity = 1, note = '' } = req.body;
        const normalizedQuantity = Number(quantity);

        if (!productId || normalizedQuantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid product or quantity' });
        }

        const product = await Product.findById(productId);
        if (!product || !product.isAvailable) {
            return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
        }

        const cart = await getOrCreateCart(req.user.id);
        const existingItem = cart.items.find(
            (item) => item.product.toString() === product._id.toString()
        );

        if (existingItem) {
            existingItem.quantity += normalizedQuantity;
            existingItem.note = note || existingItem.note;
            existingItem.price = product.price;
            existingItem.name = product.name;
            existingItem.image = product.image;
        } else {
            cart.items.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: normalizedQuantity,
                image: product.image,
                note
            });
        }

        recalculateCart(cart);
        await cart.save();
        await cart.populate('items.product', 'name price image category isAvailable');

        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { quantity, note } = req.body;
        const normalizedQuantity = Number(quantity);
        const cart = await getOrCreateCart(req.user.id);
        const item = cart.items.find(
            (cartItem) => cartItem.product.toString() === req.params.productId
        );

        if (!item) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        if (normalizedQuantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        item.quantity = normalizedQuantity;
        if (note !== undefined) {
            item.note = note;
        }

        recalculateCart(cart);
        await cart.save();
        await cart.populate('items.product', 'name price image category isAvailable');

        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.removeCartItem = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);
        cart.items = cart.items.filter(
            (item) => item.product.toString() !== req.params.productId
        );

        recalculateCart(cart);
        await cart.save();
        await cart.populate('items.product', 'name price image category isAvailable');

        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
