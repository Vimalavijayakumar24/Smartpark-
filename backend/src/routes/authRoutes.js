const express = require('express');
const {
  register,
  login,
  getMe,
  updateMe,
  updateVehicle,
  changePassword,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegistration } = require('../middleware/validationMiddleware');

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', validateRegistration, register);
router.post('/login', login);
router.post('/logout', logout);

// Authenticated User Endpoints
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.patch('/me/vehicle', protect, updateVehicle);
router.post('/change-password', protect, changePassword);

module.exports = router;
