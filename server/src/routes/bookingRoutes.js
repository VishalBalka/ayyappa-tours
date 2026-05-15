const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { createBooking } = require("../controllers/bookingController");
const { bookingLimiter } = require("../middleware/rateLimiter");

const validateBooking = [
  body("trip_id").isInt().withMessage("Valid trip ID is required"),
  body("customer_name").trim().notEmpty().withMessage("Name is required").escape(),
  body("customer_email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("customer_phone").trim().escape(),
  body("persons").isInt({ min: 1 }).withMessage("At least 1 person is required"),
  body("travel_date").isISO8601().withMessage("Valid date is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
  }
];

router.post("/", bookingLimiter, validateBooking, createBooking);

module.exports = router;
