/**
 * ==========================================
 * SMARTPARK AI — TOP-RIGHT TOOLBAR & USER CONTROLS
 * Profile, Multilingual, Appearance, Notifications
 * ==========================================
 */

let notificationsCache = [];
let pollingInterval = null;

/**
 * Build and inject the horizontal toolbar
 */
function renderTopbarControls() {
  const container = document.getElementById('topbar-toolbar') || document.querySelector('.topbar-actions');
  if (!container) return;

  const currentLang = getCurrentLanguage ? getCurrentLanguage() : 'en';
  const currentTheme = getStoredTheme ? getStoredTheme() : 'system';

  container.innerHTML = `
    <div class="topbar-toolbar-inner">
      <!-- 1. Multilingual Selector -->
      <div class="toolbar-item" title="Select Language">
        <label for="lang-select" class="sr-only">Language</label>
        <div class="select-wrapper">
          <span class="toolbar-icon">🌐</span>
          <select id="lang-select" class="toolbar-select" aria-label="Language selection">
            <option value="en" ${currentLang === 'en' ? 'selected' : ''}>EN (English)</option>
            <option value="ta" ${currentLang === 'ta' ? 'selected' : ''}>தமிழ் (Tamil)</option>
          </select>
        </div>
      </div>

      <!-- 2. System Appearance Selector -->
      <div class="toolbar-item" title="Appearance Theme">
        <label for="theme-select" class="sr-only">Theme</label>
        <div class="select-wrapper">
          <span class="toolbar-icon">🌓</span>
          <select id="theme-select" class="toolbar-select" aria-label="System appearance">
            <option value="system" ${currentTheme === 'system' ? 'selected' : ''}>💻 System</option>
            <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>☀️ Light</option>
            <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>🌙 Dark</option>
          </select>
        </div>
      </div>

      <!-- 3. Notifications Bell & Panel -->
      <div class="toolbar-item notification-wrapper">
        <button id="notif-bell-btn" class="toolbar-btn notif-btn" type="button" aria-label="Notifications" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
          </svg>
          <span id="notif-badge" class="notif-badge hidden">0</span>
        </button>

        <!-- Notification Dropdown Panel -->
        <div id="notif-dropdown" class="notif-dropdown hidden">
          <div class="notif-header">
            <div style="font-weight: 700; font-size: 0.95rem;" data-i18n="tb_notifications">Notifications</div>
            <button id="notif-mark-all-btn" class="btn-link small" type="button" data-i18n="tb_mark_read">Mark all read</button>
          </div>
          <div id="notif-list" class="notif-list">
            <p class="muted small" style="padding: 1rem; text-align: center;">Loading notifications...</p>
          </div>
          <div class="notif-footer">
            <a href="notifications.html" class="small" style="font-weight: 600;">Open Notification Center →</a>
          </div>
        </div>
      </div>

      <!-- 4. Profile Avatar & Drawer Trigger -->
      <div class="toolbar-item profile-wrapper">
        <button id="profile-toggle-btn" class="toolbar-btn profile-btn" type="button" aria-label="Profile and Account" title="My Account">
          <span class="profile-avatar" id="topbar-avatar-initial">D</span>
          <span class="profile-name-short hidden-mobile" id="topbar-username">Driver</span>
          <span class="dropdown-chevron">▾</span>
        </button>

        <!-- Profile Quick Dropdown Modal -->
        <div id="profile-dropdown" class="profile-dropdown hidden">
          <div class="profile-dropdown-header">
            <div class="profile-dropdown-name" id="pop-user-name">Alex Morgan</div>
            <div class="profile-dropdown-email muted small" id="pop-user-email">user@smartpark.ai</div>
          </div>
          <div class="profile-dropdown-details">
            <div class="detail-row">
              <span class="detail-label muted">RFID Card:</span>
              <span class="detail-val font-mono" id="pop-user-rfid">RF-882194</span>
            </div>
            <div class="detail-row">
              <span class="detail-label muted">Vehicle Plate:</span>
              <span class="detail-val font-mono badge badge-info" id="pop-user-vehicle">SP-EV-8821</span>
            </div>
            <div class="detail-row">
              <span class="detail-label muted">Phone:</span>
              <span class="detail-val" id="pop-user-phone">+1-555-0199</span>
            </div>
          </div>
          <div class="profile-dropdown-actions">
            <button id="btn-quick-password-modal" class="btn btn-secondary btn-sm btn-block" type="button" style="margin-bottom: 0.5rem;" data-i18n="prof_password_manage">
              🔒 Change Password
            </button>
            <a href="profile.html" class="btn btn-secondary btn-sm btn-block" style="margin-bottom: 0.5rem;" data-i18n="nav_profile">
              Manage Full Profile
            </a>
            <button id="topbar-logout-btn" class="btn btn-danger btn-sm btn-block" type="button" data-i18n="nav_signout">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Management Modal Popup -->
    <div id="password-modal" class="modal-overlay hidden">
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="margin: 0;" data-i18n="prof_password_manage">Security: Change Password</h3>
          <button id="close-password-modal" class="modal-close-btn" type="button">&times;</button>
        </div>
        <form id="password-change-form">
          <div class="form-group">
            <label for="modal-curr-pass" data-i18n="prof_curr_password">Current Password</label>
            <input id="modal-curr-pass" type="password" required placeholder="Enter current password" />
          </div>
          <div class="form-group">
            <label for="modal-new-pass" data-i18n="prof_new_password">New Password</label>
            <input id="modal-new-pass" type="password" required minlength="6" placeholder="Min. 6 characters" />
          </div>
          <div class="form-group">
            <label for="modal-confirm-pass" data-i18n="prof_confirm_new_password">Confirm New Password</label>
            <input id="modal-confirm-pass" type="password" required minlength="6" placeholder="Re-enter new password" />
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.25rem;">
            <button id="cancel-password-modal" type="button" class="btn btn-secondary" data-i18n="btn_cancel">Cancel</button>
            <button type="submit" class="btn btn-primary" id="submit-change-pass" data-i18n="prof_update_password_btn">Update Password</button>
          </div>
        </form>
      </div>
    </div>
  `;

  bindToolbarEvents();
  fetchUserProfile();
  fetchNotifications();
  startNotificationsPolling();
}

/**
 * Bind interactive events for toolbar controls
 */
function bindToolbarEvents() {
  // 1. Language selector
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }

  // 2. Appearance theme selector
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  }

  // 3. Notifications dropdown toggle
  const notifBtn = document.getElementById('notif-bell-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  const profileDropdown = document.getElementById('profile-dropdown');

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
      if (profileDropdown) profileDropdown.classList.add('hidden');
    });
  }

  // Mark all read button
  const markAllBtn = document.getElementById('notif-mark-all-btn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await apiRequest('/notifications/mark-all-read', { method: 'POST' });
        showToast('All notifications marked as read.');
        fetchNotifications();
      } catch (err) {
        console.warn('Could not mark all notifications as read:', err);
      }
    });
  }

  // 4. Profile dropdown toggle
  const profileBtn = document.getElementById('profile-toggle-btn');
  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('hidden');
      if (notifDropdown) notifDropdown.classList.add('hidden');
    });
  }

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBtn) {
      notifDropdown.classList.add('hidden');
    }
    if (profileDropdown && !profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
      profileDropdown.classList.add('hidden');
    }
  });

  // Topbar sign out button
  const topbarLogout = document.getElementById('topbar-logout-btn');
  if (topbarLogout) {
    topbarLogout.addEventListener('click', async () => {
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
      } catch (e) {}
      clearAuth();
      showToast('Signed out successfully.');
      setTimeout(() => {
        location.href = 'login.html';
      }, 400);
    });
  }

  // Password Management Modal
  const openPassModalBtn = document.getElementById('btn-quick-password-modal');
  const passModal = document.getElementById('password-modal');
  const closePassModalBtn = document.getElementById('close-password-modal');
  const cancelPassModalBtn = document.getElementById('cancel-password-modal');
  const passForm = document.getElementById('password-change-form');

  if (openPassModalBtn && passModal) {
    openPassModalBtn.addEventListener('click', () => {
      if (profileDropdown) profileDropdown.classList.add('hidden');
      passModal.classList.remove('hidden');
    });

    const closeModal = () => passModal.classList.add('hidden');
    if (closePassModalBtn) closePassModalBtn.addEventListener('click', closeModal);
    if (cancelPassModalBtn) cancelPassModalBtn.addEventListener('click', closeModal);

    if (passForm) {
      passForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const curr = document.getElementById('modal-curr-pass').value;
        const newPass = document.getElementById('modal-new-pass').value;
        const confirmPass = document.getElementById('modal-confirm-pass').value;

        if (newPass !== confirmPass) {
          showToast('New passwords do not match. Please verify.');
          return;
        }

        const submitBtn = document.getElementById('submit-change-pass');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Updating...';
        }

        try {
          await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword: curr, newPassword: newPass }),
          });
          showToast('Password changed successfully!');
          passForm.reset();
          closeModal();
        } catch (err) {
          showToast(err.message || 'Password update failed.');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Password';
          }
        }
      });
    }
  }
}

/**
 * Fetch authenticated profile from backend
 */
async function fetchUserProfile() {
  try {
    const profile = await apiRequest('/auth/me');
    if (profile) {
      sessionStorage.setItem('smartpark-user', JSON.stringify(profile));

      // Update popover fields
      const popName = document.getElementById('pop-user-name');
      const popEmail = document.getElementById('pop-user-email');
      const popRfid = document.getElementById('pop-user-rfid');
      const popVehicle = document.getElementById('pop-user-vehicle');
      const popPhone = document.getElementById('pop-user-phone');
      const topName = document.getElementById('topbar-username');
      const topAvatar = document.getElementById('topbar-avatar-initial');

      const name = profile.fullName || profile.name || 'Driver';
      if (popName) popName.textContent = name;
      if (topName) topName.textContent = name.split(' ')[0];
      if (topAvatar) topAvatar.textContent = name.charAt(0).toUpperCase();

      if (popEmail) popEmail.textContent = profile.email || 'user@smartpark.ai';
      if (popRfid) popRfid.textContent = profile.rfid || 'RF-882194';
      if (popVehicle) popVehicle.textContent = profile.vehicleNumber || 'SP-EV-8821';
      if (popPhone) popPhone.textContent = profile.phone || '+1-555-0199';

      // Update any page-level [data-user-...] elements
      document.querySelectorAll('[data-user-name]').forEach((el) => (el.textContent = name));
      document.querySelectorAll('[data-user-vehicle]').forEach((el) => (el.textContent = profile.vehicleNumber || 'SP-EV-8821'));
    }
  } catch (err) {
    console.warn('[Topbar] Profile fetch error:', err.message);
  }
}

/**
 * Fetch real notifications from backend
 */
async function fetchNotifications() {
  const badge = document.getElementById('notif-badge');
  const listEl = document.getElementById('notif-list');

  try {
    const res = await apiRequest('/notifications');
    const list = res.notifications || [];
    notificationsCache = list;

    const unread = list.filter((n) => !n.read).length;

    if (badge) {
      if (unread > 0) {
        badge.textContent = unread > 9 ? '9+' : unread;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (listEl) {
      if (list.length === 0) {
        listEl.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: var(--muted); font-size: 0.85rem;">
            ${t('tb_no_notifications', 'No notifications at this time.')}
          </div>
        `;
        return;
      }

      const lang = getCurrentLanguage();

      listEl.innerHTML = list.slice(0, 10).map((n) => {
        const title = (lang === 'ta' && n.titleTa) ? n.titleTa : n.title;
        const msg = (lang === 'ta' && n.messageTa) ? n.messageTa : n.message;
        const isUnread = !n.read;
        const timeAgo = formatTimeAgo(n.createdAt);

        let icon = 'ℹ️';
        if (n.category === 'booking' || n.type === 'success') icon = '✅';
        else if (n.category === 'timer' || n.type === 'warning') icon = '⏳';
        else if (n.category === 'gate') icon = '🚧';
        else if (n.type === 'danger') icon = '⚠️';

        return `
          <div class="notif-item ${isUnread ? 'unread' : ''}" data-id="${n._id || n.id}">
            <span class="notif-item-icon">${icon}</span>
            <div class="notif-item-content">
              <div class="notif-item-title">${escapeHTML(title)}</div>
              <div class="notif-item-msg">${escapeHTML(msg)}</div>
              <div class="notif-item-time">${timeAgo}</div>
            </div>
          </div>
        `;
      }).join('');

      // Add click handler to mark individual notification as read
      listEl.querySelectorAll('.notif-item.unread').forEach((item) => {
        item.addEventListener('click', async () => {
          const id = item.dataset.id;
          try {
            await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
            item.classList.remove('unread');
            fetchNotifications();
          } catch (e) {}
        });
      });
    }
  } catch (err) {
    if (listEl) {
      listEl.innerHTML = '<p class="muted small" style="padding: 1rem;">Notification feed offline.</p>';
    }
  }
}

/**
 * Format timestamp into human-readable relative time
 */
function formatTimeAgo(isoString) {
  if (!isoString) return 'recently';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

/**
 * Real-time event polling every 8 seconds
 */
function startNotificationsPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(fetchNotifications, 8000);
}

// Global listener for language switch to re-render notifications
window.addEventListener('smartpark:language-changed', () => {
  fetchNotifications();
});

// Auto-mount toolbar on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // If not on login/register page, verify authentication and render toolbar
  const isAuthPage = document.body.classList.contains('auth-page') || location.pathname.includes('login.html') || location.pathname.includes('register.html');
  if (!isAuthPage) {
    if (!isAuthenticated()) {
      location.href = 'login.html';
      return;
    }
    renderTopbarControls();
  }
});
