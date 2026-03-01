const express = require("express");
const router = express.Router();
const { createBooking } = require("../controllers/bookingController");
const { bookingLimiter } = require("../middleware/rateLimiter");

router.post("/", bookingLimiter, createBooking);  // POST /api/bookings

module.exports = router;
