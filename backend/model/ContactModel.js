const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            default: ''
        },
        phone: {
            type: String,
            trim: true,
            default: ''
        },
        subject: {
            type: String,
            trim: true,
            default: ''
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['new', 'processing', 'resolved'],
            default: 'new'
        },
        responseNote: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Contact', contactSchema);
