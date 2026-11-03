/**
 * ==========================================
 * SMARTPARK AI — SYSTEM APPEARANCE CONTROLLER
 * Light, Dark & System Adaptive Theming
 * ==========================================
 */

const THEME_STORAGE_KEY = 'smartpark_theme';

function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  let effectiveTheme = theme;
  if (theme === 'system') {
    effectiveTheme = isSystemDark ? 'dark' : 'light';
  }

  root.setAttribute('data-theme', effectiveTheme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  // Update theme select or toggle buttons in UI
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = theme;
  }

  window.dispatchEvent(new CustomEvent('smartpark:theme-changed', { detail: { theme, effectiveTheme } }));
}

// Media query listener for real-time system theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  });
}

// Initialize immediately so theme doesn't flash
(function initThemeImmediately() {
  const current = getStoredTheme();
  applyTheme(current);
})();

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getStoredTheme());
});
