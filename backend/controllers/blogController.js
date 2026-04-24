const mongoose = require('mongoose');
const Blog = require('../model/BlogModel');
const slugify = require('../helpers/slugify');

const buildUniqueSlug = async (title, currentBlogId = null) => {
    const baseSlug = slugify(title) || `blog-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;

    while (
        await Blog.findOne({
            slug,
            _id: currentBlogId ? { $ne: currentBlogId } : { $exists: true }
        })
    ) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }

    return slug;
};

exports.getPublishedBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ isPublished: true })
            .populate('author', 'name email')
            .sort('-publishedAt -createdAt');

        res.status(200).json({ success: true, count: blogs.length, data: blogs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate('author', 'name email')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: blogs.length, data: blogs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getBlogByIdOrSlug = async (req, res) => {
    try {
        const identifier = req.params.idOrSlug;
        const filter = mongoose.Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : { slug: identifier };

        const blog = await Blog.findOne(filter).populate('author', 'name email');
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        if (!blog.isPublished && !['admin', 'staff'].includes(req.user?.role)) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        res.status(200).json({ success: true, data: blog });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBlog = async (req, res) => {
    try {
        const payload = { ...req.body };
        payload.slug = await buildUniqueSlug(payload.slug || payload.title);
        payload.author = req.user.id;
        if (req.file) {
            payload.coverImage = req.file.path;
        }
        if (payload.isPublished) {
            payload.publishedAt = new Date();
        }

        const blog = await Blog.create(payload);
        res.status(201).json({ success: true, data: blog });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        if (req.body.title || req.body.slug) {
            blog.slug = await buildUniqueSlug(req.body.slug || req.body.title, blog._id);
        }

        blog.title = req.body.title ?? blog.title;
        blog.summary = req.body.summary ?? blog.summary;
        blog.content = req.body.content ?? blog.content;
        blog.tags = req.body.tags ?? blog.tags;
        blog.isPublished = req.body.isPublished ?? blog.isPublished;

        if (blog.isPublished && !blog.publishedAt) {
            blog.publishedAt = new Date();
        }

        if (req.file) {
            blog.coverImage = req.file.path;
        }

        await blog.save();
        res.status(200).json({ success: true, data: blog });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        await blog.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
