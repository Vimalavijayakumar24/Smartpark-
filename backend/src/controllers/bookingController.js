const DataStore = require('../services/dataStore');
const PaymentAdapter = require('../services/paymentAdapter');
const { sendSMS } = require('../services/smsService');

/**
 * @desc    Create a new booking with server-side validation, payment and persistence
 * @route   POST /api/bookings
 * @access  Private / Authenticated
 */
const createBooking = async (req, res, next) => {
  try {
    const { parkingId, slot, startTime, durationHours } = req.body;

    if (!parkingId || !slot) {
      return res.status(400).json({
        success: false,
        message: 'Parking location ID and slot selection are required.',
      });
    }

    const duration = Number(durationHours);
    if (!duration || duration < 1 || duration > 48) {
      return res.status(400).json({
        success: false,
        message: 'Booking duration must be between 1 and 48 hours.',
      });
    }

    // 1. Verify parking location exists
    const location = await DataStore.getLocationById(parkingId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Selected parking location could not be found.',
      });
    }

    // 2. Parse start time (defaults to now)
    const start = startTime ? new Date(startTime) : new Date();
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking start time provided.',
      });
    }

    const expectedEnd = new Date(start.getTime() + duration * 60 * 60 * 1000);

    // 3. Verify slot availability for this period
    const isAvailable = await DataStore.isSlotAvailable(
      location._id || location.id,
      slot,
      start,
      expectedEnd
    );

    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: `Slot ${slot} is already booked or physically occupied. Please select an available green slot.`,
      });
    }

    // 4. Calculate total fee on the server
    const ratePerHour = Number(location.ratePerHour || 5.0);
    const totalAmount = Number((ratePerHour * duration).toFixed(2));

    // Determine user details
    const user = req.user || (await DataStore.findUserByEmail('user@smartpark.ai'));
    const userId = user ? user._id || user.id : 'usr_demo';
    const vehicleNumber = (user && user.vehicleNumber) || 'SP-EV-8821';
    const rfid = (user && user.rfid) || 'RF-882194';
    const phone = (user && user.phone) || '+1-555-0199';

    // 5. Process Payment via PaymentAdapter
    const paymentReceipt = await PaymentAdapter.processPayment({
      amount: totalAmount,
      purpose: 'booking',
      metadata: { slot, parkingId: location._id || location.id, durationHours: duration },
    });

    if (!paymentReceipt.success) {
      return res.status(402).json({
        success: false,
        message: 'Payment authorization failed. Slot reservation aborted.',
      });
    }

    // 6. Create booking record
    const booking = await DataStore.createBooking({
      user: userId,
      parkingLocation: location._id || location.id,
      slotNumber: slot.toUpperCase(),
      vehicleNumber,
      rfid,
      startTime: start,
      durationHours: duration,
      expectedEndTime: expectedEnd,
      ratePerHour,
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'paid',
    });

    // 7. Record Payment in DB
    await DataStore.createPayment({
      transactionId: paymentReceipt.transactionId,
      booking: booking._id || booking.id,
      user: userId,
      amount: totalAmount,
      purpose: 'booking',
      status: 'completed',
      gatewayResponse: paymentReceipt,
    });

    // 8. Create confirmation notifications (English & Tamil)
    const formattedEndTime = expectedEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await DataStore.createNotification({
      user: userId,
      title: 'Slot Reserved Successfully',
      titleTa: 'இடம் வெற்றிகரமாக பதிவு செய்யப்பட்டது',
      message: `Confirmed booking for slot ${slot.toUpperCase()} at ${location.name}. Pass code: ${booking.bookingCode}. Valid until ${formattedEndTime}.`,
      messageTa: `${location.name}-ல் இடம் ${slot.toUpperCase()} உறுதியானது. பாஸ் குறியீடு: ${booking.bookingCode}. முடிவு நேரம்: ${formattedEndTime}.`,
      type: 'success',
      category: 'booking',
      metadata: { bookingId: booking._id || booking.id, code: booking.bookingCode },
    });

    // 9. Send SMS alert simulation
    await sendSMS({
      phone,
      template: 'BOOKING_CONFIRMED',
      params: [booking.bookingCode, slot.toUpperCase(), location.name, formattedEndTime],
      idempotencyKey: `sms_bk_${booking._id || booking.id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      ...booking,
      id: booking._id || booking.id,
      bookingId: booking._id || booking.id,
      accessCode: booking.bookingCode,
      totalFee: totalAmount,
      endTime: expectedEnd.toISOString(),
      locationName: location.name,
      locationAddress: location.address,
      transactionId: paymentReceipt.transactionId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's active session or booking
 * @route   GET /api/bookings/active
 * @access  Private
 */
const getActiveBooking = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id || req.user.id : req.headers['x-user-id'] || 'usr_demo';
    const bookings = await DataStore.getUserBookings(userId);
    const active = (bookings || []).find((b) => ['confirmed', 'active'].includes(b.status));

    if (!active) {
      return res.json({
        success: true,
        hasActiveBooking: false,
        booking: null,
      });
    }

    const now = Date.now();
    const end = new Date(active.expectedEndTime).getTime();
    const remainingMs = Math.max(0, end - now);
    const isExpired = remainingMs <= 0;

    res.json({
      success: true,
      hasActiveBooking: true,
      booking: active,
      remainingMs,
      remainingMinutes: Math.floor(remainingMs / 60000),
      isExpired,
      currentTime: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's bookings
 * @route   GET /api/bookings/my
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id || req.user.id : req.headers['x-user-id'] || 'usr_demo';
    const bookings = await DataStore.getUserBookings(userId);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await DataStore.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Extend a booking's duration with verification and payment
 * @route   POST /api/bookings/:id/extend
 * @access  Private
 */
const extendBooking = async (req, res, next) => {
  try {
    const requestedId = req.params.id;
    let booking = null;

    if (requestedId === 'demo-booking' || requestedId === 'active') {
      const all = await DataStore.getAllBookings();
      booking = all.find((b) => ['confirmed', 'active'].includes(b.status)) || all[0];
    } else {
      booking = await DataStore.getBookingById(requestedId);
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Active booking not found to extend.',
      });
    }

    if (!['confirmed', 'active'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot extend a booking with status '${booking.status}'.`,
      });
    }

    const additionalHours = Number(req.body.additionalHours || req.body.durationHours || 1);
    if (isNaN(additionalHours) || additionalHours < 1 || additionalHours > 12) {
      return res.status(400).json({
        success: false,
        message: 'Extension hours must be between 1 and 12.',
      });
    }

    const currentEnd = new Date(booking.expectedEndTime);
    const newEnd = new Date(currentEnd.getTime() + additionalHours * 60 * 60 * 1000);

    // 1. Check for conflicting reservations during extension window
    const locId = booking.parkingLocation?._id || booking.parkingLocation?.id || booking.parkingLocation;
    const isAvail = await DataStore.isSlotAvailable(
      locId,
      booking.slotNumber,
      currentEnd,
      newEnd,
      booking._id || booking.id
    );

    if (!isAvail) {
      return res.status(409).json({
        success: false,
        message: 'Cannot extend: Another driver has already reserved this slot immediately following your session.',
      });
    }

    // 2. Calculate fee on backend
    const rate = Number(booking.ratePerHour || 5.0);
    const additionalFee = Number((rate * additionalHours).toFixed(2));
    const newTotal = Number((Number(booking.totalAmount) + additionalFee).toFixed(2));

    // 3. Initiate & verify payment on backend
    const paymentReceipt = await PaymentAdapter.processPayment({
      amount: additionalFee,
      purpose: 'extension',
      bookingId: booking._id || booking.id,
      metadata: { additionalHours, slotNumber: booking.slotNumber },
    });

    if (!paymentReceipt.success) {
      return res.status(402).json({
        success: false,
        message: 'Extension payment failed. Parking session was not extended.',
      });
    }

    // 4. Update booking end time & duration
    const updated = await DataStore.updateBooking(booking._id || booking.id, {
      durationHours: booking.durationHours + additionalHours,
      expectedEndTime: newEnd,
      totalAmount: newTotal,
    });

    // 5. Save payment record
    await DataStore.createPayment({
      transactionId: paymentReceipt.transactionId,
      booking: booking._id || booking.id,
      user: booking.user?._id || booking.user?.id || booking.user,
      amount: additionalFee,
      purpose: 'extension',
      status: 'completed',
      gatewayResponse: paymentReceipt,
    });

    // 6. Generate notification
    const formattedNewTime = newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await DataStore.createNotification({
      user: booking.user?._id || booking.user?.id || booking.user,
      title: 'Parking Session Extended',
      titleTa: 'பார்க்கிங் நேரம் நீட்டிக்கப்பட்டது',
      message: `Your booking for slot ${booking.slotNumber} was extended by ${additionalHours} hr(s) until ${formattedNewTime}. Fee paid: $${additionalFee.toFixed(2)}.`,
      messageTa: `இடம் ${booking.slotNumber}-க்கான முன்பதிவு ${additionalHours} மணிநேரம் (${formattedNewTime} வரை) நீட்டிக்கப்பட்டது. கட்டணம்: $${additionalFee.toFixed(2)}.`,
      type: 'info',
      category: 'timer',
    });

    // 7. Send SMS alert
    const userPhone = booking.user?.phone || req.user?.phone || '+1-555-0199';
    await sendSMS({
      phone: userPhone,
      template: 'TIMER_EXTENDED',
      params: [booking.slotNumber, additionalHours, formattedNewTime],
    });

    res.json({
      success: true,
      message: `Session extended by ${additionalHours} hour(s) until ${formattedNewTime}.`,
      newEndTime: newEnd.toISOString(),
      additionalFee,
      totalAmount: newTotal,
      transactionId: paymentReceipt.transactionId,
      booking: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a booking and process refund
 * @route   POST /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await DataStore.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.status === 'cancelled' || booking.status === 'cancelled_late_arrival') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled.',
      });
    }

    // 80% refund standard policy
    const refund = Number((booking.totalAmount * 0.8).toFixed(2));

    await DataStore.updateBooking(booking._id || booking.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      paymentStatus: 'refunded',
      refundAmount: refund,
    });

    // Free up slot
    const locId = booking.parkingLocation?._id || booking.parkingLocation?.id || booking.parkingLocation;
    await DataStore.updateSlot(locId, booking.slotNumber, {
      isReserved: false,
      isOccupied: false,
      status: 'available',
      currentBooking: null,
    });

    // Record refund payment
    const refundReceipt = await PaymentAdapter.processRefund({
      transactionId: `TXN-REF-${booking.bookingCode}`,
      refundAmount: refund,
      reason: 'Driver cancellation',
    });

    await DataStore.createPayment({
      transactionId: refundReceipt.refundId,
      booking: booking._id || booking.id,
      user: booking.user?._id || booking.user?.id || booking.user,
      amount: refund,
      purpose: 'refund',
      status: 'refunded',
      gatewayResponse: refundReceipt,
    });

    await DataStore.createNotification({
      user: booking.user?._id || booking.user?.id || booking.user,
      title: 'Booking Cancelled & Refunded',
      titleTa: 'முன்பதிவு ரத்து செய்யப்பட்டு திரும்பப்பெறப்பட்டது',
      message: `Booking ${booking.bookingCode} for slot ${booking.slotNumber} was cancelled. Refund of $${refund.toFixed(2)} processed to your payment method.`,
      messageTa: `இடம் ${booking.slotNumber}-க்கான முன்பதிவு ${booking.bookingCode} ரத்து செய்யப்பட்டது. $${refund.toFixed(2)} ரீஃபண்ட் செய்யப்பட்டது.`,
      type: 'warning',
      category: 'cancellation',
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Slot has been released and refund processed.',
      refundAmount: refund,
      refundId: refundReceipt.refundId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getActiveBooking,
  getMyBookings,
  getBookingById,
  extendBooking,
  cancelBooking,
};
