const DataStore = require('../services/dataStore');

/**
 * @desc    Get all parking locations (with optional search)
 * @route   GET /api/parking
 * @access  Public
 */
const getLocations = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const locations = await DataStore.getLocations(search);

    const formatted = await Promise.all(
      locations.map(async (loc) => {
        const slots = await DataStore.getSlotsForLocation(loc._id || loc.id);
        const freeSlots = slots.filter((s) => s.status === 'available').length;
        const reservedSlots = slots.filter((s) => s.status === 'reserved').length;
        const occupiedSlots = slots.filter((s) => s.status === 'occupied').length;

        return {
          id: loc._id || loc.id,
          _id: loc._id || loc.id,
          name: loc.name,
          address: loc.address,
          city: loc.city,
          coordinates: loc.coordinates || { lat: 11.0168, lng: 76.9558 },
          totalSlots: loc.totalSlots || slots.length,
          availableSlots: freeSlots,
          freeSlots,
          reservedSlots,
          occupiedSlots,
          ratePerHour: loc.ratePerHour,
          supportedVehicles: loc.supportedVehicles || ['Car', 'EV', 'SUV'],
          status: loc.status || 'Active',
          rating: loc.rating || 4.8,
        };
      })
    );

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get nearby parking locations based on GPS coordinates
 * @route   GET /api/parking/nearby
 * @access  Public
 */
const getNearbyLocations = async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user latitude and longitude query parameters are required for nearby discovery.',
      });
    }

    const radius = parseFloat(req.query.radius) || 100;
    const nearby = await DataStore.getNearbyLocations(lat, lng, radius);

    res.json({
      success: true,
      userLocation: { lat, lng },
      count: nearby.length,
      locations: nearby,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single parking location by ID with slot matrix
 * @route   GET /api/parking/:id
 * @access  Public
 */
const getLocationById = async (req, res, next) => {
  try {
    const location = await DataStore.getLocationById(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Parking facility not found.',
      });
    }

    const slots = await DataStore.getSlotsForLocation(location._id || location.id);
    const freeSlots = slots.filter((s) => s.status === 'available').length;
    const reservedSlots = slots.filter((s) => s.status === 'reserved').length;
    const occupiedSlots = slots.filter((s) => s.status === 'occupied').length;

    res.json({
      id: location._id || location.id,
      _id: location._id || location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      coordinates: location.coordinates || { lat: 11.0168, lng: 76.9558 },
      ratePerHour: location.ratePerHour,
      totalSlots: location.totalSlots || slots.length,
      availableSlots: freeSlots,
      freeSlots,
      reservedSlots,
      occupiedSlots,
      supportedVehicles: location.supportedVehicles || ['Car', 'EV', 'SUV'],
      status: location.status || 'Active',
      rating: location.rating || 4.8,
      slots: slots.map((s) => ({
        id: s._id || s.id,
        _id: s._id || s.id,
        slotNumber: s.slotNumber,
        floor: s.floor,
        type: s.type,
        status: s.status,
        isOccupied: s.isOccupied,
        isReserved: s.isReserved,
        sensorStatus: s.sensorStatus || 'online',
        sensorLastUpdated: s.sensorLastUpdated,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get slots for a specific location
 * @route   GET /api/parking/:id/slots
 * @access  Public
 */
const getSlots = async (req, res, next) => {
  try {
    const slots = await DataStore.getSlotsForLocation(req.params.id);
    res.json(slots);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLocations,
  getNearbyLocations,
  getLocationById,
  getSlots,
};
