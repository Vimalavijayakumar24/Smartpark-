const DataStore = require('../services/dataStore');
const IoTService = require('../services/iotService');
const PaymentAdapter = require('../services/paymentAdapter');
const { sendSMS } = require('../services/smsService');

/**
 * @desc    Simulate or handle hardware vehicle entry authorization
 * @route   POST /api/gate/entry
 * @access  Public / Testing / Hardware Controller
 */
const handleGateEntry = async (req, res, next) => {
  try {
    const { vehicleNumber, rfid, parkingLocationId, isSimulated = true } = req.body;
    const plate = String(vehicleNumber || '').trim().toUpperCase();
    const tag = String(rfid || '').trim().toUpperCase();

    if (!plate && !tag) {
      return res.status(400).json({
        success: false,
        accessGranted: false,
        barrierState: 'CLOSED',
        message: 'RFID tag ID or vehicle license plate is required for entry verification.',
      });
    }

    // 1. Identify user
    let user = null;
    if (plate) user = await DataStore.findUserByVehicle(plate);
    if (!user && tag) user = await DataStore.findUserByRfid(tag);

    // 2. Look for valid confirmed booking
    const allBookings = await DataStore.getAllBookings();
    const matchedBooking = allBookings.find((b) => {
      const matchPlate = plate && b.vehicleNumber && b.vehicleNumber.toUpperCase() === plate;
      const matchTag = tag && b.rfid && b.rfid.toUpperCase() === tag;
      const matchUser = user && String(b.user?._id || b.user) === String(user._id || user.id);
      return (matchPlate || matchTag || matchUser) && ['confirmed', 'active'].includes(b.status);
    });

    const now = new Date();

    if (!matchedBooking) {
      IoTService.logHardwareEvent('ENTRY_REJECTED', { plate, tag, reason: 'NO_VALID_BOOKING' });
      return res.status(403).json({
        success: false,
        accessGranted: false,
        barrierState: 'CLOSED',
        message: 'ACCESS DENIED: No active or confirmed booking found for this vehicle. Please reserve a space first.',
        vehicleNumber: plate || 'UNKNOWN',
        rfid: tag || 'UNKNOWN',
        timestamp: now.toISOString(),
        isSimulated,
      });
    }

    // 3. Authorize gate & command servo to OPEN
    const gateCommand = IoTService.commandGate('OPEN', 'AUTH_ENTRY_APPROVED');

    // 4. Update booking to active
    await DataStore.updateBooking(matchedBooking._id || matchedBooking.id, {
      status: 'active',
      arrivedAt: now,
    });

    // 5. Update slot to occupied
    const locId = matchedBooking.parkingLocation?._id || matchedBooking.parkingLocation?.id || matchedBooking.parkingLocation;
    await DataStore.updateSlot(locId, matchedBooking.slotNumber, {
      isOccupied: true,
      status: 'occupied',
      sensorStatus: 'triggered',
      sensorLastUpdated: now,
    });

    // 6. Update IoT sensor node
    IoTService.updateSlotSensor({
      locationId: locId,
      slotNumber: matchedBooking.slotNumber,
      isOccupied: true,
    });

    // 7. Create physical ParkingSession
    const session = await DataStore.createSession({
      booking: matchedBooking._id || matchedBooking.id,
      user: user ? user._id || user.id : matchedBooking.user,
      parkingLocation: locId,
      slotNumber: matchedBooking.slotNumber,
      vehicleNumber: matchedBooking.vehicleNumber,
      rfid: matchedBooking.rfid,
      entryTime: now,
      initialFee: matchedBooking.totalAmount,
      totalFee: matchedBooking.totalAmount,
      paymentStatus: 'paid',
      gateEntryAuthorized: true,
      status: 'active',
    });

    // 8. Notifications & SMS alert
    await DataStore.createNotification({
      user: user ? user._id || user.id : matchedBooking.user,
      title: 'Gate Entry Authorized',
      titleTa: 'கேட் நுழைவு அனுமதிக்கப்பட்டது',
      message: `Boom barrier opened for vehicle ${matchedBooking.vehicleNumber}. Proceed to assigned slot ${matchedBooking.slotNumber}.`,
      messageTa: `${matchedBooking.vehicleNumber} வாகனத்திற்கு கேட் திறக்கப்பட்டது. ஒதுக்கப்பட்ட இடம் ${matchedBooking.slotNumber}-ல் நிறுத்தவும்.`,
      type: 'success',
      category: 'gate',
      metadata: { slot: matchedBooking.slotNumber, session: session.sessionCode },
    });

    const userPhone = user?.phone || '+1-555-0199';
    await sendSMS({
      phone: userPhone,
      template: 'GATE_ENTRY',
      params: [matchedBooking.vehicleNumber, matchedBooking.slotNumber],
    });

    return res.json({
      success: true,
      accessGranted: true,
      action: 'entry',
      barrierState: gateCommand.barrierState,
      message: `ACCESS GRANTED: Welcome, ${user ? user.fullName : 'Driver'}! Proceed to assigned slot ${matchedBooking.slotNumber}.`,
      vehicleNumber: matchedBooking.vehicleNumber,
      rfid: matchedBooking.rfid,
      slotNumber: matchedBooking.slotNumber,
      bookingCode: matchedBooking.bookingCode,
      sessionCode: session.sessionCode,
      timestamp: now.toISOString(),
      isSimulated,
      notes: isSimulated
        ? 'Software simulation event. Ready for physical ESP32 / RC522 RFID reader integration.'
        : 'Physical hardware event acknowledged.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Simulate or handle hardware vehicle exit authorization & session checkout
 * @route   POST /api/gate/exit
 * @access  Public / Testing / Hardware Controller
 */
const handleGateExit = async (req, res, next) => {
  try {
    const { vehicleNumber, rfid, isSimulated = true } = req.body;
    const plate = String(vehicleNumber || '').trim().toUpperCase();
    const tag = String(rfid || '').trim().toUpperCase();

    const now = new Date();

    // 1. Find active session or active booking
    let session = await DataStore.getActiveSessionForVehicle(plate, tag);
    let booking = null;

    if (session && session.booking) {
      booking = await DataStore.getBookingById(session.booking);
    } else {
      const all = await DataStore.getAllBookings();
      booking = all.find(
        (b) =>
          ((plate && b.vehicleNumber === plate) || (tag && b.rfid === tag)) &&
          ['confirmed', 'active'].includes(b.status)
      );
    }

    if (!session && !booking) {
      // Guest or unregistered exit
      const gateCommand = IoTService.commandGate('OPEN', 'GUEST_EXIT');
      return res.json({
        success: true,
        accessGranted: true,
        action: 'exit',
        barrierState: gateCommand.barrierState,
        message: 'EXIT AUTHORIZED: Barrier opened for departing vehicle.',
        vehicleNumber: plate || 'GUEST',
        timestamp: now.toISOString(),
        isSimulated,
      });
    }

    // 2. Calculate duration and overstay fees if applicable
    const entryTime = session ? new Date(session.entryTime) : booking.arrivedAt ? new Date(booking.arrivedAt) : new Date(booking.startTime);
    const durationMinutes = Math.max(1, Math.round((now.getTime() - entryTime.getTime()) / 60000));
    const expectedEnd = booking ? new Date(booking.expectedEndTime) : now;

    let overstayMinutes = 0;
    let overstayFee = 0;

    if (now.getTime() > expectedEnd.getTime()) {
      overstayMinutes = Math.round((now.getTime() - expectedEnd.getTime()) / 60000);
      const ratePerHour = booking ? Number(booking.ratePerHour || 5.0) : 5.0;
      const overstayHours = Math.ceil(overstayMinutes / 60);
      overstayFee = Number((overstayHours * ratePerHour * 1.25).toFixed(2)); // Overstay penalty rate 1.25x
    }

    const slotNumber = session?.slotNumber || booking?.slotNumber || 'A-01';
    const locId = session?.parkingLocation || booking?.parkingLocation?._id || booking?.parkingLocation?.id || booking?.parkingLocation;

    // 3. Authorize gate to OPEN
    const gateCommand = IoTService.commandGate('OPEN', 'AUTH_EXIT_APPROVED');

    // 4. Update session
    if (session) {
      await DataStore.updateSession(session._id || session.id, {
        exitTime: now,
        durationMinutes,
        overstayMinutes,
        overstayFee,
        totalFee: (session.initialFee || 0) + overstayFee,
        status: 'completed',
        gateExitAuthorized: true,
      });
    }

    // 5. Update booking
    if (booking) {
      await DataStore.updateBooking(booking._id || booking.id, {
        status: 'completed',
        departedAt: now,
      });
    }

    // 6. Free up slot
    if (locId && slotNumber) {
      await DataStore.updateSlot(locId, slotNumber, {
        isOccupied: false,
        isReserved: false,
        status: 'available',
        sensorStatus: 'online',
        sensorLastUpdated: now,
        currentBooking: null,
      });

      IoTService.updateSlotSensor({
        locationId: locId,
        slotNumber,
        isOccupied: false,
      });
    }

    // 7. Notifications & SMS alert
    const userId = session?.user || booking?.user?._id || booking?.user?.id || booking?.user;
    const finalSettled = (booking?.totalAmount || 0) + overstayFee;

    await DataStore.createNotification({
      user: userId,
      title: 'Gate Exit Recorded',
      titleTa: 'கேட் வெளியேறுதல் பதிவு செய்யப்பட்டது',
      message: `Barrier opened. Parking session completed for slot ${slotNumber}. Settled: $${finalSettled.toFixed(2)}. Safe journey!`,
      messageTa: `கேட் திறக்கப்பட்டது. இடம் ${slotNumber}-க்கான பார்க்கிங் நிறைவடைந்தது. செலுத்தப்பட்ட தொகை: $${finalSettled.toFixed(2)}. நன்றி!`,
      type: 'info',
      category: 'gate',
      metadata: { slot: slotNumber, durationMinutes, overstayMinutes, overstayFee },
    });

    const userPhone = booking?.user?.phone || '+1-555-0199';
    await sendSMS({
      phone: userPhone,
      template: 'GATE_EXIT',
      params: [slotNumber, finalSettled],
    });

    return res.json({
      success: true,
      accessGranted: true,
      action: 'exit',
      barrierState: gateCommand.barrierState,
      message: `EXIT AUTHORIZED: Thank you for parking with SmartPark AI! Have a safe journey.`,
      vehicleNumber: plate,
      slotNumber,
      durationMinutes,
      overstayMinutes,
      overstayFee,
      totalSettled: finalSettled,
      timestamp: now.toISOString(),
      isSimulated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Simulate or receive ultrasonic / IR sensor occupancy event
 * @route   POST /api/gate/sensor
 * @access  Public / ESP32 Hardware Webhook
 */
const handleSensorUpdate = async (req, res, next) => {
  try {
    const { parkingLocationId, slotNumber, isOccupied, sensorType } = req.body;

    if (!slotNumber) {
      return res.status(400).json({ success: false, message: 'Slot number is required.' });
    }

    const locId = parkingLocationId || 'loc_vs_mall';
    const occupied = Boolean(isOccupied);

    // Update physical slot state
    const updatedSlot = await DataStore.updateSlot(locId, slotNumber, {
      isOccupied: occupied,
      status: occupied ? 'occupied' : 'available',
      sensorStatus: 'triggered',
      sensorLastUpdated: new Date(),
    });

    const sensorState = IoTService.updateSlotSensor({
      locationId: locId,
      slotNumber,
      isOccupied: occupied,
      sensorType: sensorType || 'ultrasonic',
    });

    res.json({
      success: true,
      message: `Slot ${slotNumber} sensor updated to: ${occupied ? 'OCCUPIED' : 'FREE'}.`,
      slot: updatedSlot,
      sensorNode: sensorState,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get real-time gate controller & hardware sensor status
 * @route   GET /api/gate/status
 * @access  Public
 */
const getGateStatus = async (req, res) => {
  const status = IoTService.getGateStatus();
  const logs = IoTService.getHardwareLogs(25);
  res.json({
    success: true,
    ...status,
    logs,
  });
};

/**
 * @desc    Legacy simulation wrapper
 * @route   POST /api/gate/simulate
 * @access  Public
 */
const simulateGateEvent = async (req, res, next) => {
  const action = (req.body.action || 'entry').toLowerCase();
  if (action === 'exit') {
    return handleGateExit(req, res, next);
  }
  return handleGateEntry(req, res, next);
};

module.exports = {
  handleGateEntry,
  handleGateExit,
  handleSensorUpdate,
  getGateStatus,
  simulateGateEvent,
};
