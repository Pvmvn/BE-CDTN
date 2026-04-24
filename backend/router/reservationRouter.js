const express = require('express');
const {
    createReservation,
    getMyReservations,
    getReservations,
    updateReservationStatus,
    cancelReservation
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/', createReservation);
router.get('/my-reservations', getMyReservations);
router.get('/', authorize('admin', 'staff'), getReservations);
router.put('/:id/status', authorize('admin', 'staff'), updateReservationStatus);
router.put('/:id/cancel', cancelReservation);

module.exports = router;
