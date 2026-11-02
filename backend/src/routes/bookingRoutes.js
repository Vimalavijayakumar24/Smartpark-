const express = require('express');
const {
  createBooking,
  getActiveBooking,
  getMyBookings,
  getBookingById,
  extendBooking,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/active', protect, getActiveBooking);
router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.post('/:id/extend', protect, extendBooking);
router.post('/:id/cancel', protect, cancelBooking);

module.exports = router;
