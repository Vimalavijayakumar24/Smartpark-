const express = require('express');
const {
  getSystemStats,
  getAllBookings,
  commandGate,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/stats', getSystemStats);
router.get('/bookings', getAllBookings);
router.post('/gate/command', commandGate);

module.exports = router;
