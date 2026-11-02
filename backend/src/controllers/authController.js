const DataStore = require('../services/dataStore');
const { generateToken } = require('../middleware/authMiddleware');

/**
 * @desc    Register a new user with 7 mandatory fields
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { fullName, phone, password, rfid, vehicleNumber, email } =
      req.sanitizedRegistration;

    // 1. Check for duplicate email
    const existingEmail = await DataStore.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // 2. Check for duplicate RFID
    const existingRfid = await DataStore.findUserByRfid(rfid);
    if (existingRfid) {
      return res.status(409).json({
        success: false,
        message: 'This RFID number is already registered to another user.',
      });
    }

    // 3. Check for duplicate Vehicle Number
    const existingVehicle = await DataStore.findUserByVehicle(vehicleNumber);
    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: 'This vehicle registration number is already in use.',
      });
    }

    // 4. Create user
    const user = await DataStore.createUser({
      fullName,
      email,
      phone,
      password,
      rfid,
      vehicleNumber,
      role: 'driver',
    });

    const token = generateToken(user);

    // Create a welcome notification
    await DataStore.createNotification({
      user: user._id || user.id,
      title: 'Account Created Successfully',
      titleTa: 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது',
      message: `Welcome to SmartPark AI, ${fullName}! Your RFID (${rfid}) and vehicle (${vehicleNumber}) are now registered.`,
      messageTa: `SmartPark AI-க்கு வரவேற்கிறோம், ${fullName}! உங்கள் RFID (${rfid}) மற்றும் வாகனம் (${vehicleNumber}) பதிவு செய்யப்பட்டுள்ளன.`,
      type: 'success',
      category: 'system',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to SmartPark AI!',
      token,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        rfid: user.rfid,
        vehicleNumber: user.vehicleNumber,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await DataStore.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: user._id || user.id,
        fullName: user.fullName || user.name,
        name: user.fullName || user.name,
        email: user.email,
        phone: user.phone,
        rfid: user.rfid,
        vehicleNumber: user.vehicleNumber,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      id: user._id || user.id,
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      rfid: user.rfid,
      vehicleNumber: user.vehicleNumber,
      role: user.role,
      vehicle: {
        plate: user.vehicleNumber,
        model: 'Registered Vehicle',
        rfid: user.rfid,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update profile
 * @route   PATCH /api/auth/me
 * @access  Private
 */
const updateMe = async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const updates = {};
    if (fullName) updates.fullName = fullName.trim();
    if (phone) updates.phone = phone.trim();

    const updated = await DataStore.updateUser(req.user._id || req.user.id, updates);
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vehicle registration
 * @route   PATCH /api/auth/me/vehicle
 * @access  Private
 */
const updateVehicle = async (req, res, next) => {
  try {
    const { vehicleNumber, rfid } = req.body;
    const updates = {};
    if (vehicleNumber) updates.vehicleNumber = vehicleNumber.trim().toUpperCase();
    if (rfid) updates.rfid = rfid.trim().toUpperCase();

    const updated = await DataStore.updateUser(req.user._id || req.user.id, updates);
    res.json({
      success: true,
      message: 'Vehicle details updated successfully.',
      vehicle: {
        plate: updated.vehicleNumber,
        rfid: updated.rfid,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await DataStore.findUserById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    await DataStore.updatePassword(user._id || user.id, newPassword);

    await DataStore.createNotification({
      user: user._id || user.id,
      title: 'Security Notice: Password Changed',
      titleTa: 'பாதுகாப்பு அறிவிப்பு: கடவுச்சொல் மாற்றப்பட்டது',
      message: 'Your account password was updated successfully.',
      messageTa: 'உங்கள் கணக்கு கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது.',
      type: 'info',
      category: 'system',
    });

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log user out
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Signed out successfully.',
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  updateVehicle,
  changePassword,
  logout,
};
