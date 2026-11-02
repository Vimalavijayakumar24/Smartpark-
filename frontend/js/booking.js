/**
 * ==========================================
 * SMARTPARK AI — SLOT BOOKING CONTROLLER
 * Real-Time Slot Matrix, Color Coding & Checkout Flow
 * ==========================================
 */

let selectedLocationId = 'loc_vs_mall';
let selectedSlotNumber = '';
let currentRatePerHour = 6.0;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(location.search);
  const locationFromUrl = urlParams.get('id');
  if (locationFromUrl) {
    selectedLocationId = locationFromUrl;
  }

  const locationSelect = document.getElementById('location-select');
  if (locationSelect) {
    locationSelect.value = selectedLocationId;
    locationSelect.addEventListener('change', (e) => {
      selectedLocationId = e.target.value;
      selectedSlotNumber = '';
      updateSelectedSlotUI();
      loadFacilitySlots();
    });
  }

  // Pre-fill start time input with current local time
  const startTimeInput = document.getElementById('booking-start-time');
  if (startTimeInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    startTimeInput.value = now.toISOString().slice(0, 16);
  }

  // Duration select price listener
  const durationSelect = document.getElementById('booking-duration');
  if (durationSelect) {
    durationSelect.addEventListener('change', updatePriceCalculations);
  }

  // Form submit handler
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleBookingSubmit);
  }

  await loadFacilitySlots();
});

/**
 * Load facility details and slot states from backend
 */
async function loadFacilitySlots() {
  const slotGrid = document.getElementById('slot-grid');
  const rateDisplay = document.getElementById('display-rate');
  const summaryRate = document.getElementById('summary-rate-display');
  const availCountEl = document.getElementById('display-available-count');

  if (!slotGrid) return;

  try {
    const facility = await apiRequest(`/parking/${encodeURIComponent(selectedLocationId)}`);
    currentRatePerHour = Number(facility.ratePerHour || 6.0);

    if (rateDisplay) rateDisplay.textContent = `$${currentRatePerHour.toFixed(2)}/hr`;
    if (summaryRate) summaryRate.textContent = `$${currentRatePerHour.toFixed(2)} / hr`;

    const slots = facility.slots || [];
    const freeCount = slots.filter((s) => s.status === 'available').length;
    if (availCountEl) availCountEl.textContent = `${freeCount} Free`;

    if (slots.length === 0) {
      slotGrid.innerHTML = '<p class="muted">No slot telemetry found for this facility.</p>';
      return;
    }

    slotGrid.innerHTML = slots.map((s) => {
      const isSelected = s.slotNumber === selectedSlotNumber;
      const isFree = s.status === 'available';

      let statusClass = 'available';
      if (s.status === 'reserved') statusClass = 'reserved';
      else if (s.status === 'occupied') statusClass = 'occupied';

      if (isSelected) statusClass += ' selected';

      return `
        <button
          type="button"
          class="slot ${statusClass}"
          data-slot="${escapeHTML(s.slotNumber)}"
          data-status="${s.status}"
          ${!isFree && !isSelected ? 'disabled' : ''}
          title="${s.slotNumber} (${s.type}) - ${s.status}"
        >
          <div style="font-size: 0.95rem; font-weight: 800;">${escapeHTML(s.slotNumber)}</div>
          <small style="font-size: 0.68rem; display: block; opacity: 0.85;">${s.type === 'ev' ? '⚡ EV' : s.type === 'accessible' ? '♿ Acc' : 'Std'}</small>
        </button>
      `;
    }).join('');

    bindSlotInteractions();
    updatePriceCalculations();
  } catch (err) {
    console.warn('[Booking] Could not load facility slots:', err);
    slotGrid.innerHTML = '<p class="muted">Unable to retrieve live slot layout. Please retry.</p>';
  }
}

/**
 * Bind click selection to free slots
 */
function bindSlotInteractions() {
  const slotGrid = document.getElementById('slot-grid');
  if (!slotGrid) return;

  slotGrid.querySelectorAll('.slot:not(:disabled)').forEach((btn) => {
    btn.addEventListener('click', () => {
      slotGrid.querySelectorAll('.slot').forEach((item) => item.classList.remove('selected'));
      btn.classList.add('selected');

      selectedSlotNumber = btn.dataset.slot;
      updateSelectedSlotUI();
      showToast(`Selected Slot ${selectedSlotNumber}`);
    });
  });
}

function updateSelectedSlotUI() {
  const displaySlot = document.getElementById('display-selected-slot');
  if (displaySlot) {
    displaySlot.textContent = selectedSlotNumber ? `Slot ${selectedSlotNumber}` : 'None Selected';
    displaySlot.style.color = selectedSlotNumber ? 'var(--primary)' : 'var(--muted)';
  }
}

function updatePriceCalculations() {
  const durationSelect = document.getElementById('booking-duration');
  const feeDisplay = document.getElementById('display-total-fee');
  const hours = Number(durationSelect ? durationSelect.value : 2) || 2;
  const total = (hours * currentRatePerHour).toFixed(2);

  if (feeDisplay) {
    feeDisplay.textContent = `$${total}`;
  }
}

/**
 * Submit booking request to backend
 */
async function handleBookingSubmit(e) {
  e.preventDefault();

  if (!selectedSlotNumber) {
    showToast('Please select an available green parking slot first.');
    return;
  }

  const durationSelect = document.getElementById('booking-duration');
  const startTimeInput = document.getElementById('booking-start-time');
  const submitBtn = document.getElementById('submit-booking-btn');

  const durationHours = Number(durationSelect ? durationSelect.value : 2);
  const startTime = startTimeInput && startTimeInput.value ? new Date(startTimeInput.value).toISOString() : new Date().toISOString();

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Verifying & Processing Payment...';
  }

  try {
    const result = await apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        parkingId: selectedLocationId,
        slot: selectedSlotNumber,
        durationHours,
        startTime,
      }),
    });

    sessionStorage.setItem('smartpark-confirmation', JSON.stringify(result));
    sessionStorage.removeItem('smartpark-selected-slot');

    showToast(`Slot ${selectedSlotNumber} confirmed! Redirecting...`);

    setTimeout(() => {
      location.href = 'confirmation.html';
    }, 600);
  } catch (err) {
    console.error('[Booking Error]', err);
    showToast(err.message || 'Slot reservation could not be completed.');
    // Refresh slot states in case another user booked it
    loadFacilitySlots();
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Confirm & Pay →';
    }
  }
}
