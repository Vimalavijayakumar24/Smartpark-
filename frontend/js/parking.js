/**
 * ==========================================
 * SMARTPARK AI — NEARBY PARKING CONTROLLER
 * Geolocation Distance Calculation & Discovery
 * ==========================================
 */

let userCoords = null;

document.addEventListener('DOMContentLoaded', () => {
  const detectBtn = document.getElementById('btn-request-gps');
  const retryBtn = document.getElementById('btn-retry-gps');
  const fallbackBtn = document.getElementById('btn-fallback-browse');

  if (detectBtn) {
    detectBtn.addEventListener('click', requestUserLocation);
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', requestUserLocation);
  }

  if (fallbackBtn) {
    fallbackBtn.addEventListener('click', () => {
      document.getElementById('gps-denied-alert')?.classList.add('hidden');
      loadAllFacilitiesFallback();
    });
  }

  // Load standard facilities list initially or trigger geolocation prompt
  loadAllFacilitiesFallback();
});

/**
 * Ask browser permission for GPS coordinates
 */
function requestUserLocation() {
  const statusText = document.getElementById('gps-status-text');
  const deniedAlert = document.getElementById('gps-denied-alert');
  const resultsGrid = document.getElementById('nearby-results-grid');

  if (!navigator.geolocation) {
    showToast('Browser Geolocation is not supported by your device.');
    loadAllFacilitiesFallback();
    return;
  }

  if (statusText) statusText.textContent = 'Acquiring GPS coordinates from device sensor...';
  if (deniedAlert) deniedAlert.classList.add('hidden');
  if (resultsGrid) resultsGrid.innerHTML = '<p class="muted">Calculating nearby distances...</p>';

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      userCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      if (statusText) {
        statusText.innerHTML = `📍 GPS Fixed: <strong>${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° E</strong>`;
      }

      await loadNearbyFacilities(userCoords.lat, userCoords.lng);
    },
    (error) => {
      console.warn('[Geolocation] User denied or unavailable:', error.message);
      if (statusText) {
        statusText.textContent = 'Location permission denied. Showing all network parking facilities.';
      }
      if (deniedAlert) deniedAlert.classList.remove('hidden');
      loadAllFacilitiesFallback();
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

/**
 * Request distances from backend Haversine calculation API
 */
async function loadNearbyFacilities(lat, lng) {
  const resultsGrid = document.getElementById('nearby-results-grid');
  const heading = document.getElementById('results-heading');
  const countPill = document.getElementById('results-count-pill');

  try {
    const res = await apiRequest(`/parking/nearby?lat=${lat}&lng=${lng}&radius=500`);
    const locations = res.locations || [];

    if (heading) heading.textContent = 'Facilities Near You (Sorted by Distance)';
    if (countPill) countPill.textContent = `${locations.length} locations within range`;

    renderParkingCards(locations, true);
  } catch (err) {
    console.warn('[Nearby API] Error:', err);
    loadAllFacilitiesFallback();
  }
}

/**
 * Fallback to all facilities when GPS is unavailable
 */
async function loadAllFacilitiesFallback() {
  const resultsGrid = document.getElementById('nearby-results-grid');
  const heading = document.getElementById('results-heading');
  const countPill = document.getElementById('results-count-pill');

  try {
    const locations = await apiRequest('/parking');
    const list = Array.isArray(locations) ? locations : [];

    if (heading) heading.textContent = 'All Network Parking Facilities';
    if (countPill) countPill.textContent = `${list.length} facilities active`;

    renderParkingCards(list, false);
  } catch (err) {
    if (resultsGrid) {
      resultsGrid.innerHTML = '<p class="muted">Could not retrieve facilities from the backend network.</p>';
    }
  }
}

/**
 * Render parking cards with all details specified in Section 8:
 * Name, Address, Distance in km, Hourly fee, Total slots, Free slots, Reserved slots, Occupied slots, Book Slot action
 */
function renderParkingCards(locations, hasGpsDistance) {
  const resultsGrid = document.getElementById('nearby-results-grid');
  if (!resultsGrid) return;

  if (locations.length === 0) {
    resultsGrid.innerHTML = '<p class="muted">No parking facilities found matching query.</p>';
    return;
  }

  resultsGrid.innerHTML = locations.map((loc) => {
    const total = Number(loc.totalSlots || 20);
    const free = Number(loc.freeSlots !== undefined ? loc.freeSlots : loc.availableSlots || 0);
    const reserved = Number(loc.reservedSlots || Math.floor(total * 0.15));
    const occupied = Number(loc.occupiedSlots || Math.max(0, total - free - reserved));
    const rate = Number(loc.ratePerHour || 5.0).toFixed(2);
    const distanceBadge = hasGpsDistance && loc.distanceKm !== undefined
      ? `<span class="badge badge-info" style="font-size: 0.82rem;">📍 ${Number(loc.distanceKm).toFixed(1)} km away</span>`
      : `<span class="badge badge-secondary" style="font-size: 0.82rem;">📍 GPS Not Enabled</span>`;

    return `
      <article class="parking-card" style="display: flex; flex-direction: column; height: 100%;">
        <div class="flex-between" style="margin-bottom: 0.65rem;">
          ${distanceBadge}
          <span class="badge ${free > 0 ? 'badge-success' : 'badge-danger'}">${free} Free Slots</span>
        </div>

        <h3 class="location-title" style="margin-top: 0; margin-bottom: 0.35rem; font-size: 1.15rem;">
          ${escapeHTML(loc.name)}
        </h3>
        <p class="location-address" style="margin-bottom: 0.85rem; color: var(--muted); font-size: 0.85rem;">
          ${escapeHTML(loc.address || loc.city)}
        </p>

        <!-- Slots Telemetry Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; background: var(--surface-alt); padding: 0.65rem; border-radius: var(--radius); margin-bottom: 1rem; text-align: center; font-size: 0.78rem;">
          <div>
            <span class="muted" style="display: block;">Total</span>
            <strong style="color: var(--text);">${total}</strong>
          </div>
          <div>
            <span style="display: block; color: var(--slot-free); font-weight: 700;">Free</span>
            <strong style="color: var(--slot-free);">${free}</strong>
          </div>
          <div>
            <span style="display: block; color: var(--slot-reserved); font-weight: 700;">Reserved</span>
            <strong style="color: var(--slot-reserved);">${reserved}</strong>
          </div>
          <div>
            <span style="display: block; color: var(--slot-occupied); font-weight: 700;">Occupied</span>
            <strong style="color: var(--slot-occupied);">${occupied}</strong>
          </div>
        </div>

        <!-- Fee & Booking Action -->
        <div class="location-stats" style="margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="small muted" style="display: block;">Rate</span>
            <span class="location-rate" style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">$${rate}/hr</span>
          </div>
          <a class="btn btn-primary" href="bookslot.html?id=${encodeURIComponent(loc._id || loc.id)}">
            Book Slot →
          </a>
        </div>
      </article>
    `;
  }).join('');
}
