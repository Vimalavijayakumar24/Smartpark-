/**
 * ==========================================
 * SMARTPARK AI — IOT & HARDWARE INTEGRATION SERVICE
 * ESP32, RFID, ANPR, Servo Gate & Slot Sensor Hub
 * ==========================================
 */

class IoTService {
  constructor() {
    this.gateState = {
      barrierState: 'CLOSED', // 'CLOSED', 'OPENING', 'OPEN', 'CLOSING'
      lastCommand: null,
      lastEventTime: new Date().toISOString(),
      gateId: 'GATE_BOOM_01',
      mode: 'AUTOMATIC',
    };

    this.sensorNodes = new Map(); // slotId -> { status, lastHeartbeat, isOccupied }
    this.hardwareLogs = [];
  }

  logHardwareEvent(type, payload) {
    const entry = {
      id: `hw_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.hardwareLogs.unshift(entry);
    if (this.hardwareLogs.length > 200) this.hardwareLogs.pop();
    console.log(`[IoT Hub] [${type}]`, JSON.stringify(payload));
    return entry;
  }

  /**
   * Command gate servo to open or close
   */
  commandGate(command = 'OPEN', source = 'AUTOMATED_VERIFICATION') {
    const validCommands = ['OPEN', 'CLOSE', 'HOLD_OPEN', 'RESET'];
    if (!validCommands.includes(command.toUpperCase())) {
      throw new Error(`Invalid gate command: ${command}`);
    }

    const targetState = command.toUpperCase() === 'OPEN' ? 'OPEN' : 'CLOSED';
    this.gateState.barrierState = targetState;
    this.gateState.lastCommand = command.toUpperCase();
    this.gateState.lastEventTime = new Date().toISOString();

    const log = this.logHardwareEvent('GATE_BARRIER_COMMAND', {
      gateId: this.gateState.gateId,
      command: command.toUpperCase(),
      resultingState: targetState,
      source,
    });

    return {
      gateId: this.gateState.gateId,
      barrierState: this.gateState.barrierState,
      timestamp: this.gateState.lastEventTime,
      log,
    };
  }

  getGateStatus() {
    return {
      ...this.gateState,
      activeSensorNodesCount: this.sensorNodes.size,
    };
  }

  /**
   * Process ESP32 IR or ultrasonic slot sensor ping
   */
  updateSlotSensor({ locationId, slotNumber, isOccupied, sensorType = 'ultrasonic', signalStrength = -55 }) {
    const key = `${locationId}_${slotNumber.toUpperCase()}`;
    const state = {
      locationId,
      slotNumber: slotNumber.toUpperCase(),
      isOccupied: Boolean(isOccupied),
      sensorType,
      signalStrength,
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
    };

    this.sensorNodes.set(key, state);

    this.logHardwareEvent('SLOT_SENSOR_UPDATE', {
      slot: slotNumber.toUpperCase(),
      occupied: isOccupied,
      sensor: sensorType,
    });

    return state;
  }

  getHardwareLogs(limit = 50) {
    return this.hardwareLogs.slice(0, limit);
  }
}

module.exports = new IoTService();
