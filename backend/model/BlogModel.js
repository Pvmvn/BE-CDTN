const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        summary: {
            type: String,
            trim: true,
            default: ''
        },
        content: {
            type: String,
            required: true
        },
        coverImage: {
            type: String,
            default: ''
        },
        tags: {
            type: [String],
            default: []
        },
        author: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        publishedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Blog', blogSchema);
