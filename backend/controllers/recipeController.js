const Recipe = require('../model/RecipeModel');

exports.getRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find()
            .populate('product', 'name price')
            .populate('ingredients.ingredient', 'name unit quantityInStock')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: recipes.length, data: recipes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getRecipeByProduct = async (req, res) => {
    try {
        const recipe = await Recipe.findOne({ product: req.params.productId })
            .populate('product', 'name price')
            .populate('ingredients.ingredient', 'name unit quantityInStock');

        if (!recipe) {
            return res.status(404).json({ success: false, message: 'Recipe not found' });
        }

        res.status(200).json({ success: true, data: recipe });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.create(req.body);
        res.status(201).json({ success: true, data: recipe });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
            .populate('product', 'name price')
            .populate('ingredients.ingredient', 'name unit quantityInStock');

        if (!recipe) {
            return res.status(404).json({ success: false, message: 'Recipe not found' });
        }

        res.status(200).json({ success: true, data: recipe });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ success: false, message: 'Recipe not found' });
        }

        await recipe.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
