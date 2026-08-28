const API_BASE = 'https://seva-api-1uco.onrender.com/api/public';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export const api = {
  getReviews: () => request('/public/reviews'),
  getStats: () => request('/public/stats'),
};
