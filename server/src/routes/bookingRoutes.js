const express = require("express");
const router  = express.Router();
const { body, validationResult } = require("express-validator");
const { createBooking, getAllBookings, updateBookingStatus } = require("../controllers/bookingController");
const { bookingLimiter } = require("../middleware/rateLimiter");

const validateBooking = [
  body("customer_name")
    .trim().notEmpty().withMessage("Full name is required.")
    .isLength({ min:2, max:255 }).withMessage("Name must be 2–255 characters.")
    .escape(),

  body("customer_email")
    .trim().isEmail().withMessage("A valid email address is required.")
    .isLength({ max:255 }).withMessage("Email too long.")
    .normalizeEmail(),

  body("customer_phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s()]{6,25}$/).withMessage("Invalid phone number format.")
    .escape(),

  body("place")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max:255 }).withMessage("Destination name too long.")
    .escape(),

  body("persons")
    .isInt({ min:1, max:100 }).withMessage("Number of persons must be between 1 and 100."),

  body("travel_date")
    .isISO8601().withMessage("A valid travel date is required.")
    .custom((value) => {
      const today = new Date(); today.setHours(0,0,0,0);
      if (new Date(value) < today) throw new Error("Travel date must be today or in the future.");
      return true;
    }),

  body("special_requests")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max:1000 }).withMessage("Special requests must be under 1000 characters.")
    .escape(),

  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: errors.array()[0].msg });
    next();
  },
];

// Public routes
router.post("/",              bookingLimiter, validateBooking, createBooking);

// Admin routes (protected by authMiddleware in adminRoutes)
router.get("/",               getAllBookings);
router.patch("/:id/status",   updateBookingStatus);

module.exports = router;