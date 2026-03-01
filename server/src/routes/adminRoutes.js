const express = require("express");
const router  = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  adminLogin, adminLogout, getStats, getLoginLogs,
} = require("../controllers/adminController");

const {
  getAllBookings, updateBookingStatus,
} = require("../controllers/bookingController");

const {
  getAllTripsAdmin, createTrip, updateTrip,
  toggleTripAvailability, deleteTrip,
} = require("../controllers/tripController");

// ── Public ────────────────────────────────────────────────────────────────
router.post("/login",  adminLogin);   // rate limiting handled in app.js
router.post("/logout", adminLogout);  // clears HttpOnly cookie

// ── Protected (cookie JWT required for everything below) ──────────────────
router.use(authMiddleware);

// Stats & logs
router.get("/stats", getStats);
router.get("/logs",  getLoginLogs);

// Bookings
router.get("/bookings",                getAllBookings);
router.patch("/bookings/:id/status",   updateBookingStatus);

// Trips
router.get("/trips",               getAllTripsAdmin);
router.post("/trips",              createTrip);
router.put("/trips/:id",           updateTrip);
router.patch("/trips/:id/toggle",  toggleTripAvailability);
router.delete("/trips/:id",        deleteTrip);

module.exports = router;