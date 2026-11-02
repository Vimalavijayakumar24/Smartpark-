/**
 * ==========================================
 * SMARTPARK AI — GATE BARRIER & IOT CONTROLLER
 * Servo Gate Animation, RFID/ANPR & Sensor Simulation
 * ==========================================
 */

const SIMULATED_SLOTS = ['A-01', 'A-02', 'A-03', 'A-04', 'A-05'];
const slotStates = {
  'A-01': false,
  'A-02': false,
  'A-03': true,
  'A-04': false,
  'A-05': true,
};

document.addEventListener('DOMContentLoaded', async () => {
  renderSensorNodes();
  loadGateStatusAndLogs();

  // "Use My Registered Info" Auto-Fill
  const fillDriverBtn = document.getElementById('btn-fill-driver-info');
  if (fillDriverBtn) {
    fillDriverBtn.addEventListener('click', () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('smartpark-user') || '{}');
        const plateInput = document.getElementById('sim-plate-input');
        const rfidInput = document.getElementById('sim-rfid-input');

        if (plateInput) plateInput.value = user.vehicleNumber || 'SP-EV-8821';
        if (rfidInput) rfidInput.value = user.rfid || 'RF-882194';

        showToast('Auto-filled registered vehicle plate & RFID card UID.');
      } catch (e) {}
    });
  }

  // Gate Action Submit
  const gateForm = document.getElementById('gate-access-form');
  if (gateForm) {
    gateForm.addEventListener('submit', handleGateSimulationSubmit);
  }

  // Refresh logs button
  const refreshLogsBtn = document.getElementById('btn-refresh-logs');
  if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', loadGateStatusAndLogs);
  }
});

/**
 * Handle Gate Entry / Exit Simulation
 */
async function handleGateSimulationSubmit(e) {
  e.preventDefault();

  const action = document.getElementById('gate-operation-select')?.value || 'entry';
  const vehicleNumber = document.getElementById('sim-plate-input')?.value.trim().toUpperCase();
  const rfid = document.getElementById('sim-rfid-input')?.value.trim().toUpperCase();
  const triggerBtn = document.getElementById('btn-trigger-gate');
  const decisionBox = document.getElementById('gate-decision-box');

  if (!vehicleNumber && !rfid) {
    showToast('Please provide a vehicle plate or RFID card UID.');
    return;
  }

  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = 'Verifying with SmartPark Backend...';
  }

  try {
    const endpoint = action === 'exit' ? '/gate/exit' : '/gate/entry';
    const result = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ vehicleNumber, rfid }),
    });

    if (result.accessGranted) {
      // 1. Trigger Visual Gate Servo Open
      animateGateBarrier(true, result.message);

      // 2. Render Success Decision Box
      if (decisionBox) {
        decisionBox.classList.remove('hidden');
        decisionBox.style.background = 'var(--success-bg)';
        decisionBox.style.border = '1px solid var(--success-border)';
        decisionBox.style.color = 'var(--success-text)';
        decisionBox.innerHTML = `
          <strong style="display: block; font-size: 1rem; margin-bottom: 0.35rem;">✓ ACCESS GRANTED — Barrier Servo Commanded OPEN</strong>
          <div>${escapeHTML(result.message)}</div>
          <div style="margin-top: 0.5rem; font-size: 0.82rem; color: var(--text);">
            <span>Vehicle: <strong>${escapeHTML(result.vehicleNumber || vehicleNumber)}</strong></span> ·
            <span>Slot: <strong>${escapeHTML(result.slotNumber || 'Assigned')}</strong></span> ·
            <span>Code: <strong>${escapeHTML(result.bookingCode || result.sessionCode || 'SP-PASS')}</strong></span>
          </div>
          <div class="small muted" style="margin-top: 0.4rem; font-style: italic;">
            ${escapeHTML(result.notes || 'Hardware simulation: Ready for physical ESP32 / Servo PWM output pin.')}
          </div>
        `;
      }

      showToast('Gate barrier opened! Drive safely.');

      // Auto-close gate after 5 seconds to simulate vehicle passing loop detector
      setTimeout(() => {
        animateGateBarrier(false, 'Vehicle cleared optical loop sensor. Barrier returned to CLOSED.');
      }, 5000);
    } else {
      // Access Denied
      animateGateBarrier(false);
      renderDeniedDecision(result.message || 'Access Denied.');
    }

    loadGateStatusAndLogs();
  } catch (err) {
    console.warn('[Gate Simulator Error]', err);
    animateGateBarrier(false);
    renderDeniedDecision(err.message || 'Access Denied: No active booking found.');
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = 'Scan & Authorize Gate Barrier →';
    }
  }
}

/**
 * Animate the barrier boom gate arm
 */
function animateGateBarrier(isOpen, statusMessage = '') {
  const scene = document.getElementById('barrier-scene');
  const pill = document.getElementById('barrier-state-pill');
  const lastCmd = document.getElementById('gate-last-command');

  if (isOpen) {
    scene?.classList.add('open');
    if (pill) {
      pill.textContent = 'BARRIER OPEN (PASS)';
      pill.className = 'badge badge-success';
    }
    if (lastCmd) lastCmd.textContent = 'Last Command: SERVO_PWM_90_DEG (OPEN)';
  } else {
    scene?.classList.remove('open');
    if (pill) {
      pill.textContent = 'BARRIER CLOSED';
      pill.className = 'badge badge-danger';
    }
    if (lastCmd && statusMessage) lastCmd.textContent = `Last Command: SERVO_PWM_0_DEG (CLOSED)`;
  }
}

function renderDeniedDecision(msg) {
  const decisionBox = document.getElementById('gate-decision-box');
  if (decisionBox) {
    decisionBox.classList.remove('hidden');
    decisionBox.style.background = 'var(--danger-bg)';
    decisionBox.style.border = '1px solid var(--danger-border)';
    decisionBox.style.color = 'var(--danger-text)';
    decisionBox.innerHTML = `
      <strong style="display: block; font-size: 1rem; margin-bottom: 0.25rem;">⛔ ACCESS DENIED — Barrier Remains CLOSED</strong>
      <div>${escapeHTML(msg)}</div>
      <div style="margin-top: 0.5rem; font-size: 0.82rem;">
        No active booking or RFID match found. Please reserve a space via Dashboard.
      </div>
    `;
  }
  showToast('Access denied: Barrier remains locked.');
}

/**
 * Render ESP32 ultrasonic sensor nodes
 */
function renderSensorNodes() {
  const container = document.getElementById('sensor-nodes-list');
  if (!container) return;

  container.innerHTML = SIMULATED_SLOTS.map((slot) => {
    const isOccupied = slotStates[slot];
    return `
      <div class="sensor-slot-pill">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: ${isOccupied ? 'var(--slot-occupied)' : 'var(--slot-free)'};"></span>
          <div>
            <strong style="font-size: 0.95rem;">Slot ${slot}</strong>
            <span class="small muted" style="display: block;">Sensor: HC-SR04 (${isOccupied ? 'Car Detected' : 'Clear'})</span>
          </div>
        </div>
        <button
          type="button"
          class="btn ${isOccupied ? 'btn-secondary' : 'btn-primary'} btn-sm"
          onclick="toggleSlotSensor('${slot}')"
        >
          ${isOccupied ? 'Clear Space (Mark Free)' : 'Park Car (Mark Occupied)'}
        </button>
      </div>
    `;
  }).join('');
}

/**
 * Toggle sensor node state and report to backend
 */
async function toggleSlotSensor(slot) {
  const current = slotStates[slot];
  const next = !current;
  slotStates[slot] = next;
  renderSensorNodes();

  try {
    const res = await apiRequest('/gate/sensor', {
      method: 'POST',
      body: JSON.stringify({
        parkingLocationId: 'loc_vs_mall',
        slotNumber: slot,
        isOccupied: next,
        sensorType: 'ultrasonic',
      }),
    });

    showToast(`Slot ${slot} sensor reported: ${next ? 'OCCUPIED' : 'FREE'}`);
    loadGateStatusAndLogs();
  } catch (err) {
    console.warn('Sensor update failed:', err);
  }
}

/**
 * Load gate status and live hardware command logs
 */
async function loadGateStatusAndLogs() {
  const consoleEl = document.getElementById('hardware-logs-console');
  if (!consoleEl) return;

  try {
    const res = await apiRequest('/gate/status');
    const logs = res.logs || [];

    if (logs.length === 0) {
      consoleEl.innerHTML = '[IoT] No recent telemetry logs.';
      return;
    }

    consoleEl.innerHTML = logs.map((l) => {
      const time = new Date(l.timestamp).toLocaleTimeString();
      return `<div>[${time}] [${l.type}] ${JSON.stringify(l.payload)}</div>`;
    }).join('');
  } catch (err) {
    consoleEl.innerHTML = '[IoT] Telemetry listener offline.';
  }
}
