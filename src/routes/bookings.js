import { Router }   from 'express';
import authenticate from '../middleware/auth.js';
import { sendSuccess, sendError }                from '../utils/response.js';
import { toPositiveInt, parsePagination }        from '../utils/validation.js';
import { bookSeats, listUserBookings, cancelBooking } from '../services/bookingService.js';

const router = Router();

router.post('/events/:id/book', authenticate, async (req, res, next) => {
  try {
    const eventId = toPositiveInt(req.params.id);
    if (Number.isNaN(eventId)) return sendError(res, 'Invalid event ID');

    const seats = toPositiveInt(req.body.seats);
    if (Number.isNaN(seats)) return sendError(res, 'seats must be a positive integer');

    const result = await bookSeats({ eventId, userId: req.user.id, seats });
    return sendSuccess(res, result.booking, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/bookings', authenticate, async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const result = await listUserBookings({ userId: req.user.id, limit, offset });
    return sendSuccess(res, { ...result, limit, offset });
  } catch (err) {
    next(err);
  }
});

router.delete('/bookings/:id', authenticate, async (req, res, next) => {
  try {
    const bookingId = toPositiveInt(req.params.id);
    if (Number.isNaN(bookingId)) return sendError(res, 'Invalid booking ID');

    await cancelBooking({ bookingId, userId: req.user.id });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;