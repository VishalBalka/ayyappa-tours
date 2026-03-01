// Secure API client
// - Uses fetch with credentials: "include" so HttpOnly cookies are sent automatically
// - Token is NEVER stored in JS, localStorage, or sessionStorage
// - All errors are normalized

const BASE = "/api";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include", // sends HttpOnly cookie automatically
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // Parse response
  let data;
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    data = await res.json();
  } else {
    data = { message: await res.text() };
  }

  if (!res.ok) {
    throw new ApiError(
      data?.error || data?.message || `Request failed (${res.status})`,
      res.status
    );
  }

  return data;
}

// ── Public API ────────────────────────────────────────────────────────────
export const api = {
  // Trips
  getTrips:    ()           => request("/trips"),
  getTrip:     (id)         => request(`/trips/${id}`),

  // Bookings
  createBooking: (payload)  => request("/bookings", { method: "POST", body: JSON.stringify(payload) }),

  // Admin auth
  login:   (creds)          => request("/admin/login",  { method: "POST", body: JSON.stringify(creds) }),
  logout:  ()               => request("/admin/logout", { method: "POST" }),

  // Admin — all protected by HttpOnly cookie
  getStats:     ()          => request("/admin/stats"),
  getBookings:  ()          => request("/admin/bookings"),
  getLogs:      ()          => request("/admin/logs"),

  updateBookingStatus: (id, status) =>
    request(`/admin/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  getAdminTrips: ()         => request("/admin/trips"),
  createTrip:    (data)     => request("/admin/trips",      { method: "POST",   body: JSON.stringify(data) }),
  updateTrip:    (id, data) => request(`/admin/trips/${id}`,{ method: "PUT",    body: JSON.stringify(data) }),
  deleteTrip:    (id)       => request(`/admin/trips/${id}`,{ method: "DELETE" }),
  toggleTrip:    (id)       => request(`/admin/trips/${id}/toggle`, { method: "PATCH" }),
};

export { ApiError };
