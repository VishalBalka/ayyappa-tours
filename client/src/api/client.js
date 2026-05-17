import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "/api";

axios.defaults.withCredentials = true;

// ── Public ────────────────────────────────────────────────────────────────
export const api = {
  // Trips (display only)
  getTrips:    ()    => axios.get(`${BASE}/trips`).then((r) => r.data),
  getTripById: (id)  => axios.get(`${BASE}/trips/${id}`).then((r) => r.data),

  // Cabs (display only)
  getCabs: () => axios.get(`${BASE}/cabs`).then((r) => r.data),

  // Places (display only)
  getPlaces: () => axios.get(`${BASE}/places`).then((r) => r.data),

  // Booking inquiry (from hero form)
  createBooking: (data) => axios.post(`${BASE}/bookings`, data).then((r) => r.data),

  // ── Admin ─────────────────────────────────────────────────────────────
  adminLogin: (data) => axios.post(`${BASE}/admin/login`, data).then((r) => r.data),

  getStats:   ()          => axios.get(`${BASE}/admin/stats`).then((r) => r.data),
  getLogs:    ()          => axios.get(`${BASE}/admin/logs`).then((r) => r.data),
  getBookings: ()         => axios.get(`${BASE}/admin/bookings`).then((r) => r.data),
  updateBookingStatus: (id, status) =>
    axios.patch(`${BASE}/admin/bookings/${id}/status`, { status }).then((r) => r.data),

  // Admin trips
  getAdminTrips: ()        => axios.get(`${BASE}/admin/trips`).then((r) => r.data),
  createTrip:    (data)    => axios.post(`${BASE}/admin/trips`, data).then((r) => r.data),
  updateTrip:    (id,data) => axios.put(`${BASE}/admin/trips/${id}`, data).then((r) => r.data),
  toggleTrip:    (id)      => axios.patch(`${BASE}/admin/trips/${id}/toggle`, {}).then((r) => r.data),
  deleteTrip:    (id)      => axios.delete(`${BASE}/admin/trips/${id}`).then((r) => r.data),

  // Admin cabs
  getAdminCabs: ()        => axios.get(`${BASE}/cabs`).then((r) => r.data),
  createCab:    (data)    => axios.post(`${BASE}/cabs`, data).then((r) => r.data),
  updateCab:    (id,data) => axios.put(`${BASE}/cabs/${id}`, data).then((r) => r.data),
  toggleCab:    (id)      => axios.patch(`${BASE}/cabs/${id}/toggle`, {}).then((r) => r.data),
  deleteCab:    (id)      => axios.delete(`${BASE}/cabs/${id}`).then((r) => r.data),

  // Admin places
  getAdminPlaces: ()        => axios.get(`${BASE}/admin/places`).then((r) => r.data),
  createPlace:    (data)    => axios.post(`${BASE}/admin/places`, data).then((r) => r.data),
  updatePlace:    (id,data) => axios.put(`${BASE}/admin/places/${id}`, data).then((r) => r.data),
  togglePlace:    (id)      => axios.patch(`${BASE}/admin/places/${id}/toggle`, {}).then((r) => r.data),
  deletePlace:    (id)      => axios.delete(`${BASE}/admin/places/${id}`).then((r) => r.data),

  // Image upload
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return axios.post(`${BASE}/admin/upload`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
};