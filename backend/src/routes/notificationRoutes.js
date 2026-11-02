const express = require('express');
const {
  getNotifications,
  markRead,
  markAllRead,
  getSimulatedSMS,
} = require('../controllers/notificationController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuth, getNotifications);
router.patch('/:id/read', optionalAuth, markRead);
router.post('/mark-all-read', optionalAuth, markAllRead);
router.get('/sms-logs', getSimulatedSMS);

module.exports = router;
