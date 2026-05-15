import axios from "axios";

// In production this will be your Render backend URL e.g. https://ayyappa-server.onrender.com/api
// In development Vite proxy rewrites /api → http://localhost:5001/api
const BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // send HttpOnly cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Token helpers (localStorage for JWT fallback) ─────────────────────────
const TOKEN_KEY = "ayyappa_admin_token";

export const setToken  = (token) => token && localStorage.setItem(TOKEN_KEY, token);
export const getToken  = ()      => localStorage.getItem(TOKEN_KEY);
export const removeToken = ()    => localStorage.removeItem(TOKEN_KEY);

// ── Attach JWT to every request if present ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Global response error handler ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear local storage and redirect to login
      removeToken();
      if (!window.location.pathname.includes("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Public endpoints ──────────────────────────────────────────────────────
export const getTrips     = ()    => api.get("/trips").then((r) => r.data);
export const getTripById  = (id)  => api.get(`/trips/${id}`).then((r) => r.data);
export const createBooking = (data) => api.post("/bookings", data).then((r) => r.data);

// ── Admin auth ────────────────────────────────────────────────────────────
export const adminLogin  = (data) => api.post("/admin/login", data).then((r) => r.data);
export const adminLogout = ()     => api.post("/admin/logout").then((r) => r.data);

// ── Admin stats & logs ────────────────────────────────────────────────────
export const getStats = () => api.get("/admin/stats").then((r) => r.data);
export const getLogs  = () => api.get("/admin/logs").then((r) => r.data);

// ── Admin bookings ────────────────────────────────────────────────────────
export const getBookings = () =>
  api.get("/admin/bookings").then((r) => r.data);

export const updateBookingStatus = (id, status) =>
  api.patch(`/admin/bookings/${id}/status`, { status }).then((r) => r.data);

// ── Admin trips ───────────────────────────────────────────────────────────
export const getAdminTrips = () =>
  api.get("/admin/trips").then((r) => r.data);

export const createTrip = (data) =>
  api.post("/admin/trips", data).then((r) => r.data);

export const updateTrip = (id, data) =>
  api.put(`/admin/trips/${id}`, data).then((r) => r.data);

export const toggleTrip = (id) =>
  api.patch(`/admin/trips/${id}/toggle`, {}).then((r) => r.data);

export const deleteTrip = (id) =>
  api.delete(`/admin/trips/${id}`).then((r) => r.data);

// ── Admin image upload ────────────────────────────────────────────────────
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api
    .post("/admin/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// ── Admin cabs ────────────────────────────────────────────────────────────
export const getAdminCabs = () =>
  api.get("/cabs").then((r) => r.data);

export const createCab = (data) =>
  api.post("/cabs", data).then((r) => r.data);

export const updateCab = (id, data) =>
  api.put(`/cabs/${id}`, data).then((r) => r.data);

export const toggleCab = (id) =>
  api.patch(`/cabs/${id}/toggle`, {}).then((r) => r.data);

export const deleteCab = (id) =>
  api.delete(`/cabs/${id}`).then((r) => r.data);

export default api;