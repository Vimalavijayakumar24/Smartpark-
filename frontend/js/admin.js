/**
 * ==========================================
 * SMARTPARK AI — ADMIN CONTROLLER
 * System Statistics, Revenue & Barrier Control
 * ==========================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const refreshBtn = document.getElementById('refresh-admin-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadAdminData);
  }

  await loadAdminData();
});

async function loadAdminData() {
  await Promise.all([loadStats(), loadAllBookings()]);
}

async function loadStats() {
  try {
    const res = await apiRequest('/admin/stats');
    const s = res.stats || {};

    const locEl = document.getElementById('admin-locations-count');
    const slotsEl = document.getElementById('admin-total-slots');
    const freeEl = document.getElementById('admin-free-slots');
    const revEl = document.getElementById('admin-total-revenue');
    const barrierEl = document.getElementById('admin-barrier-state');

    if (locEl) locEl.textContent = s.totalLocations || '4';
    if (slotsEl) slotsEl.textContent = s.totalSlots || '84';
    if (freeEl) freeEl.textContent = s.availableSlots || '66';
    if (revEl) revEl.textContent = `$${Number(s.totalRevenue || 0).toFixed(2)}`;
    if (barrierEl) barrierEl.textContent = s.barrierState || 'CLOSED';
  } catch (err) {
    console.warn('Admin stats fetch error:', err);
  }
}

async function loadAllBookings() {
  const tableContainer = document.getElementById('admin-bookings-table');
  if (!tableContainer) return;

  try {
    const list = await apiRequest('/admin/bookings');

    if (!Array.isArray(list) || list.length === 0) {
      tableContainer.innerHTML = '<p class="muted">No bookings recorded in network.</p>';
      return;
    }

    tableContainer.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Driver</th>
            <th>Facility</th>
            <th>Slot</th>
            <th>Vehicle / RFID</th>
            <th>Duration</th>
            <th>Fee</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((b) => {
            const driverName = b.user?.fullName || 'Driver';
            const locName = b.parkingLocation?.name || 'VS Mall';
            const isLive = ['confirmed', 'active'].includes(b.status);

            return `
              <tr>
                <td class="font-mono font-bold">${escapeHTML(b.bookingCode || '-')}</td>
                <td>${escapeHTML(driverName)}</td>
                <td>${escapeHTML(locName)}</td>
                <td><strong>${escapeHTML(b.slotNumber)}</strong></td>
                <td class="font-mono small">${escapeHTML(b.vehicleNumber)}</td>
                <td>${b.durationHours} hrs</td>
                <td>$${Number(b.totalAmount || 0).toFixed(2)}</td>
                <td><span class="badge ${isLive ? 'badge-success' : 'badge-secondary'}">${escapeHTML(b.status)}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    tableContainer.innerHTML = '<p class="muted">Could not load bookings table.</p>';
  }
}

async function sendAdminGateCommand(cmd) {
  try {
    const res = await apiRequest('/admin/gate/command', {
      method: 'POST',
      body: JSON.stringify({ command: cmd }),
    });
    showToast(`Admin command executed: Barrier ${cmd}`);
    loadStats();
  } catch (err) {
    showToast(err.message || 'Gate command failed.');
  }
}
