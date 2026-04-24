const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        unit: {
            type: String,
            required: true,
            trim: true
        },
        quantityInStock: {
            type: Number,
            required: true,
            min: 0
        },
        minimumStock: {
            type: Number,
            default: 0,
            min: 0
        },
        costPerUnit: {
            type: Number,
            default: 0,
            min: 0
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

module.exports = mongoose.model('Ingredient', ingredientSchema);
