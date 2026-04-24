const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema(
    {
        ingredient: {
            type: mongoose.Schema.ObjectId,
            ref: 'Ingredient',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        unit: {
            type: String,
            required: true,
            trim: true
        }
    },
    { _id: false }
);

const recipeSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: true,
            unique: true
        },
        ingredients: {
            type: [recipeIngredientSchema],
            default: []
        },
        instructions: {
            type: String,
            trim: true,
            default: ''
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

module.exports = mongoose.model('Recipe', recipeSchema);
