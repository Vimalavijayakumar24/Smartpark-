const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const gateRoutes = require('./routes/gateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const DataStore = require('./services/dataStore');
const PaymentAdapter = require('./services/paymentAdapter');

const app = express();

// CORS configuration supporting credentials and all origins
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health / Status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'SmartPark AI REST API',
    version: '2.5.0',
    features: ['Auth', 'Real-Time Slots', 'Geolocation', 'Timer Extension', 'Gate Barrier IoT', 'Dual-Language', 'Simulated Payments'],
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gate', gateRoutes);
app.use('/api/admin', adminRoutes);

// Payment Gateway Endpoints
app.post('/api/payments/simulate', async (req, res, next) => {
  try {
    const { bookingId, amount, purpose } = req.body;
    const booking = bookingId ? await DataStore.getBookingById(bookingId) : null;
    const paymentAmount = amount || (booking ? booking.totalAmount : 15.0);

    const receipt = await PaymentAdapter.processPayment({
      amount: paymentAmount,
      purpose: purpose || 'booking',
      bookingId: bookingId || 'demo_booking',
    });

    if (booking) {
      await DataStore.updateBooking(booking._id || booking.id, {
        paymentStatus: 'paid',
        status: 'confirmed',
      });
    }

    res.json({
      success: true,
      transactionId: receipt.transactionId,
      accessCode: booking ? booking.bookingCode : `SP-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingId: bookingId || 'demo_booking',
      status: 'Completed',
      amount: paymentAmount,
      timestamp: receipt.timestamp,
      message: 'Simulated payment completed successfully.',
      receipt,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/payments/verify', async (req, res, next) => {
  try {
    const { transactionId, expectedAmount } = req.body;
    const result = await PaymentAdapter.verifyPayment({ transactionId, expectedAmount });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Serve React Single Page Application (client/dist) or legacy frontend
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../../client/dist');
const legacyFrontendPath = path.join(__dirname, '../../frontend');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.use(express.static(legacyFrontendPath));
  app.get('/', (req, res) => {
    res.sendFile(path.join(legacyFrontendPath, 'login.html'));
  });
}

// Centralized error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
