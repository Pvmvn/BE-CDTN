const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            default: null
        },
        customerName: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            default: ''
        },
        tableLabel: {
            type: String,
            trim: true,
            default: ''
        },
        numberOfGuests: {
            type: Number,
            required: true,
            min: 1
        },
        reservationTime: {
            type: Date,
            required: true
        },
        durationMinutes: {
            type: Number,
            default: 90,
            min: 30
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'expired'],
            default: 'pending'
        },
        note: {
            type: String,
            trim: true,
            default: ''
        },
        cancelledAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Reservation', reservationSchema);
