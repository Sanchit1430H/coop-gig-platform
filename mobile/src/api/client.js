// Central place for the backend URL. During development on a physical
// phone with Expo Go, 'localhost' means the PHONE, not your laptop — you
// must replace this with your laptop's LAN IP (e.g. http://192.168.1.5:4000)
// or your deployed Render/Railway URL once the backend is hosted.
// Android emulator: use http://10.0.2.2:4000 instead.
export const API_BASE = 'https://seva-api-1uco.onrender.com/api';
export async function request(path, { method = 'GET', token, body } = {}) {
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
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  getCategories: (token) => request('/admin/categories', { token }),
  getWorkers: (token, query = '') => request(`/workers${query}`, { token }),

  createBooking: (token, payload) => request('/bookings', { method: 'POST', token, body: payload }),
  getBookings: (token) => request('/bookings', { token }),
  respondToBooking: (token, id, action) =>
    request(`/bookings/${id}/respond`, { method: 'PATCH', token, body: { action } }),
  updateBookingStatus: (token, id, status) =>
    request(`/bookings/${id}/status`, { method: 'PATCH', token, body: { status } }),

  pay: (token, payload) => request('/payments', { method: 'POST', token, body: payload }),
  rate: (token, payload) => request('/ratings', { method: 'POST', token, body: payload }),

  setAvailability: (token, workerId, payload) =>
    request(`/workers/${workerId}/availability`, { method: 'PATCH', token, body: payload }),
  createWorkerProfile: (token, payload) => request('/workers', { method: 'POST', token, body: payload }),

  getDashboard: (token) => request('/admin/dashboard', { token }),

  // Micro-Benefits Wallet
  getWallet: (token, workerId) => request(`/wallet/${workerId}`, { token }),
  withdrawFromWallet: (token, workerId, payload) =>
    request(`/wallet/${workerId}/withdraw`, { method: 'POST', token, body: payload }),

  // Peer Tribunal disputes
  getDisputes: (token) => request('/disputes', { token }),
  getDispute: (token, id) => request(`/disputes/${id}`, { token }),
  submitDisputeEvidence: (token, id, evidence) =>
    request(`/disputes/${id}/evidence`, { method: 'PATCH', token, body: { evidence } }),
  voteOnDispute: (token, id, vote) =>
    request(`/disputes/${id}/vote`, { method: 'POST', token, body: { vote } }),
};
