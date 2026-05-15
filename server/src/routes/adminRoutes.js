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

// Upload configuration
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  // Construct the URL based on the client request host to support docker and local
  // The frontend handles `/api/uploads` mapping to proxy or just direct URL
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

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