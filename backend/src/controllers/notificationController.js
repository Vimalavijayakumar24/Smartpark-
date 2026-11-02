const DataStore = require('../services/dataStore');
const { getSMSLogs } = require('../services/smsService');

/**
 * @desc    Get all notifications for logged-in user
 * @route   GET /api/notifications
 * @access  Private / Optional Auth
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id || req.user.id : req.headers['x-user-id'] || 'usr_demo';
    const list = await DataStore.getUserNotifications(userId);
    const unreadCount = list.filter((n) => !n.read).length;

    res.json({
      success: true,
      unreadCount,
      count: list.length,
      notifications: list,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markRead = async (req, res, next) => {
  try {
    const updated = await DataStore.markNotificationRead(req.params.id);
    res.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read for current user
 * @route   POST /api/notifications/mark-all-read
 * @access  Private
 */
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id || req.user.id : req.headers['x-user-id'] || 'usr_demo';
    await DataStore.markAllNotificationsRead(userId);
    res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get SMS logs for simulation verification
 * @route   GET /api/notifications/sms-logs
 * @access  Public / Testing
 */
const getSimulatedSMS = async (req, res) => {
  const phone = req.query.phone;
  const logs = getSMSLogs(phone);
  res.json({
    success: true,
    count: logs.length,
    logs,
  });
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  getSimulatedSMS,
};
