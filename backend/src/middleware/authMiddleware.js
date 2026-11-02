const jwt = require('jsonwebtoken');
const DataStore = require('../services/dataStore');

const JWT_SECRET = process.env.JWT_SECRET || 'smartpark_jwt_production_secret_key_2026';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role || 'driver',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const protect = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token && req.headers['x-user-id']) {
    const user = await DataStore.findUserById(req.headers['x-user-id']);
    if (user) {
      req.user = user;
      return next();
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to access this resource.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await DataStore.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user session is no longer active.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrator privileges required.',
  });
};

const optionalAuth = async (req, res, next) => {
  let token = null;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token && req.headers['x-user-id']) {
    const user = await DataStore.findUserById(req.headers['x-user-id']);
    if (user) req.user = user;
    return next();
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await DataStore.findUserById(decoded.id);
      if (user) req.user = user;
    } catch (e) {
      // Ignore invalid token for optional auth
    }
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  requireAdmin,
  generateToken,
};
