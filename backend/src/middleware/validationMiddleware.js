const validateRegistration = (req, res, next) => {
  const {
    fullName,
    phoneNumber,
    phone,
    password,
    confirmPassword,
    rfidNumber,
    rfid,
    vehicleNumber,
    email,
  } = req.body;

  const actualPhone = (phoneNumber || phone || '').trim();
  const actualRfid = (rfidNumber || rfid || '').trim().toUpperCase();
  const actualVehicle = (vehicleNumber || '').trim().toUpperCase();
  const actualName = (fullName || req.body.name || '').trim();
  const actualEmail = (email || '').trim().toLowerCase();

  const errors = [];

  // 1. Full Name
  if (!actualName || actualName.length < 2) {
    errors.push('Full name is required and must be at least 2 characters.');
  }

  // 2. Phone Number
  if (!actualPhone) {
    errors.push('Phone number is required.');
  } else if (!/^\+?[\d\s\-()]{7,20}$/.test(actualPhone)) {
    errors.push('Please enter a valid phone number format.');
  }

  // 3. Password
  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  // 4. Confirm Password
  if (!confirmPassword) {
    errors.push('Confirm Password is required.');
  } else if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  // 5. RFID Number
  if (!actualRfid) {
    errors.push('RFID number is required.');
  } else if (actualRfid.length < 4) {
    errors.push('Please enter a valid RFID identifier (minimum 4 characters).');
  }

  // 6. Vehicle Number
  if (!actualVehicle) {
    errors.push('Vehicle registration number is required.');
  } else if (actualVehicle.length < 3) {
    errors.push('Please enter a valid vehicle registration number.');
  }

  // 7. Email Address
  if (!actualEmail) {
    errors.push('Email address is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actualEmail)) {
    errors.push('Please enter a valid email address.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  req.sanitizedRegistration = {
    fullName: actualName,
    phone: actualPhone,
    password,
    rfid: actualRfid,
    vehicleNumber: actualVehicle,
    email: actualEmail,
  };

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Both email and password are required.',
    });
  }

  req.body.email = String(email).trim().toLowerCase();
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
};
