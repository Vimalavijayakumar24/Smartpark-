const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('smartpark_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('smartpark_token', token);
  } else {
    localStorage.removeItem('smartpark_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('smartpark_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('smartpark_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('smartpark_user');
  }
}

export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data.message || `Request failed with status ${response.status}`);
    err.status = response.status;
    err.errors = data.errors;
    throw err;
  }

  return data;
}

export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  me: () => request('/auth/me'),
  updateVehicle: (payload) => request('/auth/me/vehicle', { method: 'PATCH', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

export const parkingApi = {
  getLocations: () => request('/parking'),
  getLocationById: (id) => request(`/parking/${id}`),
  getSlots: (locationId) => request(`/parking/${locationId}/slots`),
};

export const bookingApi = {
  create: (bookingData) => request('/bookings', { method: 'POST', body: JSON.stringify(bookingData) }),
  getMyBookings: () => request('/bookings/my'),
  getActive: () => request('/bookings/active'),
  getById: (id) => request(`/bookings/${id}`),
  extend: (id, additionalHours) => request(`/bookings/${id}/extend`, { method: 'POST', body: JSON.stringify({ additionalHours }) }),
  cancel: (id, reason) => request(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

export const gateApi = {
  getStatus: () => request('/gate/status'),
  entry: (payload) => request('/gate/entry', { method: 'POST', body: JSON.stringify(payload) }),
  exit: (payload) => request('/gate/exit', { method: 'POST', body: JSON.stringify(payload) }),
  simulate: (payload) => request('/gate/simulate', { method: 'POST', body: JSON.stringify(payload) }),
};

export const adminApi = {
  getStats: () => request('/admin/stats'),
  getAllBookings: (params = '') => request(`/admin/bookings${params ? `?${params}` : ''}`),
  commandGate: (payload) => request('/admin/gate/command', { method: 'POST', body: JSON.stringify(payload) }),
};
