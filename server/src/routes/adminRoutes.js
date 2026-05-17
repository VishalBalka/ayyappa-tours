const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { adminLogin, adminLogout, getStats, getLoginLogs } = require("../controllers/adminController");
const { getAllBookings, updateBookingStatus }              = require("../controllers/bookingController");
const { getAllTripsAdmin, createTrip, updateTrip, toggleTripAvailability, deleteTrip } = require("../controllers/tripController");
const { getAllPlacesAdmin, createPlace, updatePlace, togglePlace, deletePlace }        = require("../controllers/placesController");

// ── Public ────────────────────────────────────────────────────────────────
router.post("/login",  adminLogin);
router.post("/logout", adminLogout);

// ── Protected ─────────────────────────────────────────────────────────────
router.use(authMiddleware);

// ── Upload ────────────────────────────────────────────────────────────────
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// ── Stats & Logs ──────────────────────────────────────────────────────────
router.get("/stats", getStats);
router.get("/logs",  getLoginLogs);

// ── Bookings ──────────────────────────────────────────────────────────────
router.get("/bookings",              getAllBookings);
router.patch("/bookings/:id/status", updateBookingStatus);

// ── Trips ─────────────────────────────────────────────────────────────────
router.get("/trips",              getAllTripsAdmin);
router.post("/trips",             createTrip);
router.put("/trips/:id",          updateTrip);
router.patch("/trips/:id/toggle", toggleTripAvailability);
router.delete("/trips/:id",       deleteTrip);

// ── Places ────────────────────────────────────────────────────────────────
router.get("/places",              getAllPlacesAdmin);
router.post("/places",             createPlace);
router.put("/places/:id",          updatePlace);
router.patch("/places/:id/toggle", togglePlace);
router.delete("/places/:id",       deletePlace);

module.exports = router;