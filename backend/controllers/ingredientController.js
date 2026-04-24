const Ingredient = require('../model/IngredientModel');

exports.getIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find().sort('name');
        res.status(200).json({ success: true, count: ingredients.length, data: ingredients });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLowStockIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find({
            $expr: { $lte: ['$quantityInStock', '$minimumStock'] }
        }).sort('name');

        res.status(200).json({ success: true, count: ingredients.length, data: ingredients });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createIngredient = async (req, res) => {
    try {
        const ingredient = await Ingredient.create(req.body);
        res.status(201).json({ success: true, data: ingredient });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateIngredient = async (req, res) => {
    try {
        const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!ingredient) {
            return res.status(404).json({ success: false, message: 'Ingredient not found' });
        }

        res.status(200).json({ success: true, data: ingredient });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteIngredient = async (req, res) => {
    try {
        const ingredient = await Ingredient.findById(req.params.id);
        if (!ingredient) {
            return res.status(404).json({ success: false, message: 'Ingredient not found' });
        }

        await ingredient.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
