const express = require('express');
const {
  getLocations,
  getNearbyLocations,
  getLocationById,
  getSlots,
} = require('../controllers/parkingController');

const router = express.Router();

router.get('/', getLocations);
router.get('/nearby', getNearbyLocations);
router.get('/:id', getLocationById);
router.get('/:id/slots', getSlots);

module.exports = router;
