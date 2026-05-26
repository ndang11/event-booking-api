import { Router }   from 'express';
import authenticate from '../middleware/auth.js';
import { sendSuccess, sendError }                        from '../utils/response.js';
import { isFutureDate, toPositiveInt, parsePagination }  from '../utils/validation.js';
import { listEvents, getEventById, createEvent, updateEvent } from '../services/eventService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const { start, end }    = req.query;

    if (start && Number.isNaN(new Date(start).getTime())) {
      return sendError(res, 'Invalid start date');
    }
    if (end && Number.isNaN(new Date(end).getTime())) {
      return sendError(res, 'Invalid end date');
    }

    const result = await listEvents({ start, end, limit, offset });
    return sendSuccess(res, { ...result, limit, offset });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (Number.isNaN(id)) return sendError(res, 'Invalid event ID');

    const event = await getEventById(id);
    if (!event) return sendError(res, 'Event not found', 404);

    return sendSuccess(res, event);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, description, date, total_seats } = req.body;

    if (!title?.trim())      return sendError(res, 'title is required');
    if (!date)               return sendError(res, 'date is required');
    if (!isFutureDate(date)) return sendError(res, 'date must be in the future');

    const seats = toPositiveInt(total_seats);
    if (Number.isNaN(seats)) return sendError(res, 'total_seats must be a positive integer');

    const event = await createEvent({
      title, description, date,
      total_seats: seats,
      createdBy: req.user.id,
    });

    return sendSuccess(res, event, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (Number.isNaN(id)) return sendError(res, 'Invalid event ID');

    const { title, description, date, total_seats } = req.body;
    const updates = {};

    if (title !== undefined)       updates.title       = title;
    if (description !== undefined) updates.description = description;

    if (date !== undefined) {
      if (!isFutureDate(date)) return sendError(res, 'date must be in the future');
      updates.date = date;
    }

    if (total_seats !== undefined) {
      const seats = toPositiveInt(total_seats);
      if (Number.isNaN(seats)) return sendError(res, 'total_seats must be a positive integer');
      updates.total_seats = seats;
    }

    const event = await updateEvent(id, req.user.id, updates);
    return sendSuccess(res, event);
  } catch (err) {
    next(err);
  }
});

export default router;