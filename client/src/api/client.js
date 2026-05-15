import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "/api";

// Ensure cookies are sent with every request for HttpOnly auth
axios.defaults.withCredentials = true;

// Helper to get auth headers
const authHeaders = () => {
  return {};
};

// ── Public ──────────────────────────────────────────────
export const api = {
  getTrips: () =>
    axios.get(`${BASE}/trips`).then((r) => r.data),

  getTripById: (id) =>
    axios.get(`${BASE}/trips/${id}`).then((r) => r.data),

  createBooking: (data) =>
    axios.post(`${BASE}/bookings`, data).then((r) => r.data),

  // ── Admin ─────────────────────────────────────────────
  adminLogin: (data) =>
    axios.post(`${BASE}/admin/login`, data).then((r) => r.data),

  getStats: () =>
    axios.get(`${BASE}/admin/stats`, { headers: authHeaders() }).then((r) => r.data),

  getBookings: () =>
    axios.get(`${BASE}/admin/bookings`, { headers: authHeaders() }).then((r) => r.data),

  updateBookingStatus: (id, status) =>
    axios.patch(`${BASE}/admin/bookings/${id}/status`, { status }, { headers: authHeaders() }).then((r) => r.data),

  getAdminTrips: () =>
    axios.get(`${BASE}/admin/trips`, { headers: authHeaders() }).then((r) => r.data),

  createTrip: (data) =>
    axios.post(`${BASE}/admin/trips`, data, { headers: authHeaders() }).then((r) => r.data),

  updateTrip: (id, data) =>
    axios.put(`${BASE}/admin/trips/${id}`, data, { headers: authHeaders() }).then((r) => r.data),

  toggleTrip: (id) =>
    axios.patch(`${BASE}/admin/trips/${id}/toggle`, {}, { headers: authHeaders() }).then((r) => r.data),

  deleteTrip: (id) =>
    axios.delete(`${BASE}/admin/trips/${id}`, { headers: authHeaders() }).then((r) => r.data),

  getLogs: () =>
    axios.get(`${BASE}/admin/logs`, { headers: authHeaders() }).then((r) => r.data),

  // ── Upload ──────────────────────────────────────────────
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return axios.post(`${BASE}/admin/upload`, formData, {
      headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
    }).then((r) => r.data);
  },

  // ── Cabs ────────────────────────────────────────────────
  getAdminCabs: () =>
    axios.get(`${BASE}/cabs`, { headers: authHeaders() }).then((r) => r.data),
  createCab: (data) =>
    axios.post(`${BASE}/cabs`, data, { headers: authHeaders() }).then((r) => r.data),
  updateCab: (id, data) =>
    axios.put(`${BASE}/cabs/${id}`, data, { headers: authHeaders() }).then((r) => r.data),
  toggleCab: (id) =>
    axios.patch(`${BASE}/cabs/${id}/toggle`, {}, { headers: authHeaders() }).then((r) => r.data),
  deleteCab: (id) =>
    axios.delete(`${BASE}/cabs/${id}`, { headers: authHeaders() }).then((r) => r.data),
};