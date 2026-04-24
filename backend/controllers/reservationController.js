const Reservation = require('../model/ReservationModel');

const isStaffRole = (role) => ['admin', 'staff'].includes(role);

exports.createReservation = async (req, res) => {
    try {
        const reservation = await Reservation.create({
            ...req.body,
            user: req.user.id
        });

        res.status(201).json({ success: true, data: reservation });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user.id }).sort('reservationTime');
        res.status(200).json({ success: true, count: reservations.length, data: reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate('user', 'name email phone')
            .sort('reservationTime');

        res.status(200).json({ success: true, count: reservations.length, data: reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateReservationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'expired'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid reservation status' });
        }

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        reservation.status = status;
        if (status === 'cancelled') {
            reservation.cancelledAt = new Date();
        }
        await reservation.save();

        res.status(200).json({ success: true, data: reservation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.cancelReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (!isStaffRole(req.user.role) && reservation.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not allowed to cancel this reservation' });
        }

        reservation.status = 'cancelled';
        reservation.cancelledAt = new Date();
        await reservation.save();

        res.status(200).json({ success: true, data: reservation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
