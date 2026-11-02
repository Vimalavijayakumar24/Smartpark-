/**
 * ==========================================
 * SMARTPARK AI — PARKING TIMER & EXTENSION CONTROLLER
 * Active Session Countdown & Backend Payment Extension Flow
 * ==========================================
 */

let activeBookingData = null;
let countdownTimerId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadActiveSessionForExtension();

  const extendHoursSelect = document.getElementById('extend-hours');
  if (extendHoursSelect) {
    extendHoursSelect.addEventListener('change', updateProjectedEndTime);
  }

  const extendForm = document.getElementById('extend-form');
  if (extendForm) {
    extendForm.addEventListener('submit', handleExtensionSubmit);
  }
});

/**
 * 1. Retrieve the current active session
 */
async function loadActiveSessionForExtension() {
  const sessionCard = document.getElementById('session-card');
  const formCard = document.getElementById('extension-form-card');

  try {
    const res = await apiRequest('/bookings/active');

    if (!res.hasActiveBooking || !res.booking) {
      if (sessionCard) {
        sessionCard.innerHTML = `
          <div style="text-align: center; padding: 2rem 1rem;">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🅿️</div>
            <h3 style="margin: 0 0 0.5rem 0;" data-i18n="extend_no_session">You have no active parking session to extend.</h3>
            <p class="muted small" style="margin: 0 0 1.25rem 0;">Reserve an available space or check into a facility first.</p>
            <a href="bookslot.html" class="btn btn-primary" data-i18n="nav_bookslot">Book a Slot Now →</a>
          </div>
        `;
        applyTranslations();
      }
      if (formCard) formCard.classList.add('hidden');
      return;
    }

    activeBookingData = res.booking;
    if (formCard) formCard.classList.remove('hidden');

    // Populate Active Session Information Fields
    const locNameEl = document.getElementById('ext-location-name');
    const slotNumEl = document.getElementById('ext-slot-number');
    const startTimeEl = document.getElementById('ext-start-time');
    const endTimeEl = document.getElementById('ext-end-time');
    const hourlyRateEl = document.getElementById('ext-hourly-rate');
    const paymentStatusEl = document.getElementById('ext-payment-status');
    const passCodeEl = document.getElementById('ext-pass-code');
    const timerDisplay = document.getElementById('ext-remaining-timer');

    if (locNameEl) locNameEl.textContent = activeBookingData.parkingLocation?.name || 'VS Mall Parking Complex';
    if (slotNumEl) slotNumEl.textContent = activeBookingData.slotNumber;
    if (passCodeEl) passCodeEl.textContent = `Code: ${activeBookingData.bookingCode || 'SP-PASS'}`;

    const startDate = new Date(activeBookingData.startTime);
    const endDate = new Date(activeBookingData.expectedEndTime);

    if (startTimeEl) startTimeEl.textContent = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (endTimeEl) endTimeEl.textContent = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const rate = Number(activeBookingData.ratePerHour || 6.0);
    if (hourlyRateEl) hourlyRateEl.textContent = `$${rate.toFixed(2)}/hr`;
    if (paymentStatusEl) paymentStatusEl.textContent = activeBookingData.paymentStatus === 'paid' ? 'Paid' : 'Pending';

    // Update extension options with dynamic rate
    const hoursSelect = document.getElementById('extend-hours');
    if (hoursSelect) {
      hoursSelect.innerHTML = `
        <option value="1" selected>+1 Hour ($${(rate * 1).toFixed(2)})</option>
        <option value="2">+2 Hours ($${(rate * 2).toFixed(2)})</option>
        <option value="3">+3 Hours ($${(rate * 3).toFixed(2)})</option>
      `;
    }

    // Start live timer countdown
    startCountdown(endDate.getTime(), timerDisplay);
    updateProjectedEndTime();
  } catch (err) {
    console.warn('[Timer] Could not load active session:', err);
    if (sessionCard) {
      sessionCard.innerHTML = '<p class="muted">Could not retrieve active session from server.</p>';
    }
  }
}

/**
 * Live ticking countdown
 */
function startCountdown(targetTimestamp, displayEl) {
  if (countdownTimerId) clearInterval(countdownTimerId);

  function tick() {
    const remaining = targetTimestamp - Date.now();

    if (remaining <= 0) {
      if (displayEl) {
        displayEl.textContent = '00:00:00';
        displayEl.style.color = 'var(--danger)';
      }
      clearInterval(countdownTimerId);
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formatted = [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].join(':');

    if (displayEl) {
      displayEl.textContent = formatted;
      displayEl.style.color = remaining <= 10 * 60 * 1000 ? 'var(--warning)' : 'var(--primary)';
    }
  }

  tick();
  countdownTimerId = setInterval(tick, 1000);
}

/**
 * Calculate dynamic projected end time & additional fee
 */
function updateProjectedEndTime() {
  if (!activeBookingData) return;

  const hoursSelect = document.getElementById('extend-hours');
  const projectedEndEl = document.getElementById('ext-new-end-time');
  const additionalFeeEl = document.getElementById('ext-additional-fee');

  const addHours = Number(hoursSelect ? hoursSelect.value : 1) || 1;
  const currentEnd = new Date(activeBookingData.expectedEndTime);
  const newEnd = new Date(currentEnd.getTime() + addHours * 60 * 60 * 1000);

  const rate = Number(activeBookingData.ratePerHour || 6.0);
  const addFee = (addHours * rate).toFixed(2);

  if (projectedEndEl) {
    projectedEndEl.textContent = newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (additionalFeeEl) {
    additionalFeeEl.textContent = `$${addFee}`;
  }
}

/**
 * Handle Extension Payment and Submission
 */
async function handleExtensionSubmit(e) {
  e.preventDefault();

  if (!activeBookingData) {
    showToast('No active booking to extend.');
    return;
  }

  const hoursSelect = document.getElementById('extend-hours');
  const submitBtn = document.getElementById('btn-submit-extend');
  const additionalHours = Number(hoursSelect ? hoursSelect.value : 1);

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Verifying Slot & Processing Payment...';
  }

  try {
    const bookingId = activeBookingData._id || activeBookingData.id;
    const res = await apiRequest(`/bookings/${bookingId}/extend`, {
      method: 'POST',
      body: JSON.stringify({ additionalHours }),
    });

    showToast(`Session successfully extended by ${additionalHours} hour(s)!`);

    // Reload active session to reflect new end time and updated countdown
    await loadActiveSessionForExtension();
  } catch (err) {
    console.error('[Extension Error]', err);
    showToast(err.message || 'Timer extension failed. Please try again.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Pay & Extend Timer →';
    }
  }
}
