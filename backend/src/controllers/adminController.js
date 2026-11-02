const DataStore = require('../services/dataStore');
const IoTService = require('../services/iotService');

/**
 * @desc    Get system-wide overview statistics
 * @route   GET /api/admin/stats
 * @access  Private / Admin
 */
const getSystemStats = async (req, res, next) => {
  try {
    const locations = await DataStore.getLocations();
    const bookings = await DataStore.getAllBookings();
    const gateStatus = IoTService.getGateStatus();

    let totalSlots = 0;
    let availableSlots = 0;
    let occupiedSlots = 0;
    let reservedSlots = 0;

    for (const loc of locations) {
      const slots = await DataStore.getSlotsForLocation(loc._id || loc.id);
      totalSlots += slots.length;
      availableSlots += slots.filter((s) => s.status === 'available').length;
      occupiedSlots += slots.filter((s) => s.status === 'occupied').length;
      reservedSlots += slots.filter((s) => s.status === 'reserved').length;
    }

    const totalRevenue = bookings
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const activeBookingsCount = bookings.filter((b) => ['confirmed', 'active'].includes(b.status)).length;

    res.json({
      success: true,
      stats: {
        totalLocations: locations.length,
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservedSlots,
        activeBookings: activeBookingsCount,
        totalBookings: bookings.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        barrierState: gateStatus.barrierState,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all system bookings
 * @route   GET /api/admin/bookings
 * @access  Private / Admin
 */
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await DataStore.getAllBookings();
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Emergency manual gate control
 * @route   POST /api/admin/gate/command
 * @access  Private / Admin
 */
const commandGate = async (req, res, next) => {
  try {
    const { command } = req.body;
    const result = IoTService.commandGate(command || 'OPEN', 'ADMIN_MANUAL_OVERRIDE');
    res.json({
      success: true,
      message: `Gate command '${command}' executed.`,
      result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemStats,
  getAllBookings,
  commandGate,
};
