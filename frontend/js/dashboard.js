/**
 * ==========================================
 * SMARTPARK AI — DASHBOARD CONTROLLER
 * Live Sessions, Ticking Countdown, Telemetry & History
 * ==========================================
 */

let timerInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadActiveSession(),
    loadFacilities(),
    loadRecentHistory(),
  ]);

  // Update dynamic translations if language switched
  window.addEventListener('smartpark:language-changed', () => {
    loadActiveSession();
    loadFacilities();
    loadRecentHistory();
  });
});

/**
 * 1. Load active session & start authoritative countdown
 */
async function loadActiveSession() {
  const container = document.getElementById('active-session-container');
  const timerDisplay = document.getElementById('active-timer-display');
  const timerNote = document.getElementById('active-timer-note');
  const locName = document.getElementById('active-location-name');
  const slotNum = document.getElementById('active-slot-number');
  const endTimeEl = document.getElementById('active-end-time');
  const feeEl = document.getElementById('active-total-fee');
  const passCode = document.getElementById('active-pass-code');
  const activeCountEl = document.getElementById('active-bookings');

  if (!container) return;

  try {
    const res = await apiRequest('/bookings/active');

    if (!res.hasActiveBooking || !res.booking) {
      if (activeCountEl) activeCountEl.textContent = '0';
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem 1.5rem; background: var(--surface-alt);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🅿️</div>
          <h3 style="margin: 0 0 0.5rem 0;" data-i18n="dash_no_active">No active parking session currently running.</h3>
          <p class="muted small" style="margin: 0 0 1.25rem 0;">Reserve an available space in advance or navigate to nearby locations.</p>
          <a href="bookslot.html" class="btn btn-primary" data-i18n="dash_reserve_now">Reserve a Slot Now →</a>
        </div>
      `;
      applyTranslations();
      return;
    }

    const b = res.booking;
    if (activeCountEl) activeCountEl.textContent = '1';

    if (passCode) passCode.textContent = `Code: ${b.bookingCode || 'SP-PASS'}`;
    if (locName) locName.textContent = b.parkingLocation?.name || 'VS Mall Parking Complex';
    if (slotNum) slotNum.textContent = b.slotNumber;

    const endDate = new Date(b.expectedEndTime);
    if (endTimeEl) {
      endTimeEl.textContent = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (feeEl) {
      feeEl.textContent = `$${Number(b.totalAmount || 0).toFixed(2)}`;
    }

    // Start live countdown based on authoritative server timestamp
    startAuthoritativeTimer(endDate.getTime(), timerDisplay, timerNote);
  } catch (err) {
    console.warn('[Dashboard] Active booking fetch failed:', err);
    if (activeCountEl) activeCountEl.textContent = '0';
  }
}

/**
 * Authoritative countdown ticker
 */
function startAuthoritativeTimer(endTimestamp, displayEl, noteEl) {
  if (timerInterval) clearInterval(timerInterval);

  function tick() {
    const remaining = endTimestamp - Date.now();

    if (remaining <= 0) {
      if (displayEl) {
        displayEl.textContent = '00:00:00';
        displayEl.style.color = 'var(--danger)';
      }
      if (noteEl) {
        noteEl.innerHTML = '<strong style="color: var(--danger);">⚠️ Session expired. Overstay rates may apply.</strong>';
      }
      clearInterval(timerInterval);
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
      if (remaining <= 10 * 60 * 1000) {
        displayEl.style.color = 'var(--warning)';
        if (noteEl) noteEl.innerHTML = '<span style="color: var(--warning); font-weight: 700;">⚠️ Less than 10 minutes remaining!</span>';
      } else {
        displayEl.style.color = 'var(--primary)';
        if (noteEl) noteEl.textContent = 'Authoritative countdown active';
      }
    }
  }

  tick();
  timerInterval = setInterval(tick, 1000);
}

/**
 * 2. Load available facilities
 */
async function loadFacilities() {
  const container = document.getElementById('dashboard-facilities-list');
  const availableCountEl = document.getElementById('available-locations');
  if (!container) return;

  try {
    const locations = await apiRequest('/parking');
    const list = Array.isArray(locations) ? locations : [];

    if (availableCountEl) {
      availableCountEl.textContent = list.length;
    }

    if (list.length === 0) {
      container.innerHTML = '<p class="muted small">No facilities currently registered.</p>';
      return;
    }

    container.innerHTML = list.slice(0, 4).map((loc) => {
      const free = Number(loc.availableSlots || loc.freeSlots || 0);
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0.85rem; background: var(--surface-alt); border-radius: var(--radius); border: 1px solid var(--border);">
          <div>
            <div style="font-weight: 700; font-size: 0.92rem; color: var(--text);">${escapeHTML(loc.name)}</div>
            <div class="muted small">${escapeHTML(loc.address || loc.city)} · $${Number(loc.ratePerHour).toFixed(2)}/hr</div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="badge ${free > 0 ? 'badge-success' : 'badge-danger'}">${free} Free</span>
            <a href="bookslot.html?id=${encodeURIComponent(loc._id || loc.id)}" class="btn btn-primary btn-sm">Book</a>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p class="muted small">Could not load facilities.</p>';
  }
}

/**
 * 3. Load recent booking history
 */
async function loadRecentHistory() {
  const container = document.getElementById('dashboard-history-list');
  if (!container) return;

  try {
    const bookings = await apiRequest('/bookings/my');
    const list = Array.isArray(bookings) ? bookings : [];

    if (list.length === 0) {
      container.innerHTML = '<p class="muted small">No past bookings found.</p>';
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Slot</th>
              <th>Location</th>
              <th>Pass Code</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${list.slice(0, 5).map((b) => {
              const statusClass = b.status === 'confirmed' ? 'badge-success' : b.status === 'active' ? 'badge-info' : b.status === 'completed' ? 'badge-secondary' : 'badge-danger';
              return `
                <tr>
                  <td><strong>${escapeHTML(b.slotNumber)}</strong></td>
                  <td class="small">${escapeHTML(b.parkingLocation?.name || 'VS Mall')}</td>
                  <td class="font-mono small">${escapeHTML(b.bookingCode || '-')}</td>
                  <td>$${Number(b.totalAmount || 0).toFixed(2)}</td>
                  <td><span class="badge ${statusClass}">${escapeHTML(b.status)}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<p class="muted small">Could not load booking history.</p>';
  }
}
