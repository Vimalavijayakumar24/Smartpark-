const express = require('express');
const {
  handleGateEntry,
  handleGateExit,
  handleSensorUpdate,
  getGateStatus,
  simulateGateEvent,
} = require('../controllers/gateController');

const router = express.Router();

router.post('/entry', handleGateEntry);
router.post('/exit', handleGateExit);
router.post('/sensor', handleSensorUpdate);
router.get('/status', getGateStatus);
router.post('/simulate', simulateGateEvent);

module.exports = router;
