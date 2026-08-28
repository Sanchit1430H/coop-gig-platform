// Change this to your deployed backend URL when hosting, or your laptop's
// LAN IP if the dashboard needs to be viewed from another device on the
// same network during the demo. localhost is fine when both the backend
// and this dashboard run on the same machine (the normal case).
export const API_BASE = 'https://seva-api-1uco.onrender.com/api';

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  getDashboard: (token) => request('/admin/dashboard', { token }),
  getForecast: (token) => request('/admin/forecast', { token }),
  getCategories: (token) => request('/admin/categories', { token }),
  createCategory: (token, payload) => request('/admin/categories', { method: 'POST', token, body: payload }),
  getSocieties: (token) => request('/admin/societies', { token }),
  createSociety: (token, payload) => request('/admin/societies', { method: 'POST', token, body: payload }),
  createFederation: (token, payload) => request('/admin/federations', { method: 'POST', token, body: payload }),

  getWorkers: (token, query = '') => request(`/workers${query}`, { token }),
  verifyWorker: (token, workerId, status) =>
    request(`/workers/${workerId}/verify`, { method: 'PATCH', token, body: { status } }),

  getBookings: (token) => request('/bookings', { token }),

  getDisputes: (token) => request('/disputes', { token }),
  getDispute: (token, id) => request(`/disputes/${id}`, { token }),
  raiseDispute: (token, payload) => request('/disputes', { method: 'POST', token, body: payload }),
};
