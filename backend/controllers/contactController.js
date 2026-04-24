const Contact = require('../model/ContactModel');

exports.createContactMessage = async (req, res) => {
    try {
        const contact = await Contact.create(req.body);
        res.status(201).json({ success: true, data: contact });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getContactMessages = async (req, res) => {
    try {
        const contacts = await Contact.find().sort('-createdAt');
        res.status(200).json({ success: true, count: contacts.length, data: contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateContactStatus = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact message not found' });
        }

        res.status(200).json({ success: true, data: contact });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
