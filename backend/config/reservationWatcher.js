const Reservation = require('../model/ReservationModel');

const startReservationWatcher = () => {
    if (process.env.ENABLE_RESERVATION_WATCHER === 'false') {
        return null;
    }

    const intervalMs = Number(process.env.RESERVATION_WATCHER_INTERVAL_MS || 60000);

    return setInterval(async () => {
        try {
            const now = new Date();

            await Reservation.updateMany(
                {
                    status: 'pending',
                    reservationTime: { $lte: now }
                },
                {
                    $set: {
                        status: 'expired'
                    }
                }
            );

            const confirmedReservations = await Reservation.find({
                status: { $in: ['confirmed', 'seated'] }
            });

            await Promise.all(
                confirmedReservations.map(async (reservation) => {
                    const reservationEnd = new Date(
                        new Date(reservation.reservationTime).getTime() +
                            reservation.durationMinutes * 60 * 1000
                    );

                    if (reservationEnd <= now) {
                        reservation.status = 'completed';
                        await reservation.save();
                    }
                })
            );
        } catch (error) {
            console.error('Reservation watcher error:', error.message);
        }
    }, intervalMs);
};

module.exports = startReservationWatcher;
