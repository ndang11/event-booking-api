import 'dotenv/config';
import express from 'express';
import authRoutes from './src/routes/auth.js';
import eventRoutes from './src/routes/events.js';
import bookingRoutes from './src/routes/bookings.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);         
app.use('/events', eventRoutes);      
app.use('/', bookingRoutes);           

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Event Booking API running on port ${PORT}`);
  });
}

export default app;

