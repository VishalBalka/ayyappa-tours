const pool = require("../config/db");
const { sendBookingReceived, sendAdminNewBooking, sendBookingConfirmed } = require("../services/emailService");
const { sendWhatsAppToAdmin, sendWhatsAppToCustomer } = require("../services/whatsappService");

// ── Reference generator ───────────────────────────────────────────────────
const generateReference = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "AYT-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
};

// ── Safe notification — never crashes the booking ─────────────────────────
const safeSend = (fn, ...args) => {
  try {
    Promise.resolve(fn(...args)).catch((err) =>
      console.error("⚠️  Notification failed (non-fatal):", err.message)
    );
  } catch (err) {
    console.error("⚠️  Notification failed (non-fatal):", err.message);
  }
};

// ── createBooking ─────────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const {
      customer_name, customer_email, customer_phone,
      place, travel_date, persons, special_requests,
    } = req.body;

    // Validation
    if (!customer_name?.trim() || !customer_email?.trim() || !travel_date || !persons) {
      return res.status(400).json({ error: "Name, email, date and number of persons are required." });
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(customer_email.trim())) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    if (Number(persons) < 1 || Number(persons) > 100) {
      return res.status(400).json({ error: "Number of persons must be between 1 and 100." });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(travel_date) < today) {
      return res.status(400).json({ error: "Travel date must be today or in the future." });
    }

    const reference = generateReference();

    const result = await pool.query(
      `INSERT INTO bookings
         (reference, customer_name, customer_email, customer_phone,
          place, travel_date, persons, special_requests)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        reference,
        customer_name.trim(),
        customer_email.trim().toLowerCase(),
        customer_phone?.trim() || null,
        place?.trim() || null,
        travel_date,
        Number(persons),
        special_requests?.trim() || null,
      ]
    );

    const booking = result.rows[0];

    // ── Respond immediately — don't wait for notifications ────────────────
    res.status(201).json({
      message:   "Booking received successfully.",
      reference: booking.reference,
      booking,
    });

    // ── Fire notifications in background after response ───────────────────
    safeSend(sendBookingReceived,    booking); // email → customer
    safeSend(sendAdminNewBooking,    booking); // email → admin
    safeSend(sendWhatsAppToAdmin,    booking); // WhatsApp → admin
    safeSend(sendWhatsAppToCustomer, booking); // WhatsApp → customer

  } catch (err) {
    console.error("❌ createBooking error:", err.message);
    return res.status(500).json({ error: "Internal server error. Please try again." });
  }
};

// ── getAllBookings (admin) ─────────────────────────────────────────────────
const getAllBookings = async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bookings ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ getAllBookings error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── updateBookingStatus (admin) ───────────────────────────────────────────
const updateBookingStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const result = await pool.query(
      "UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *",
      [status, id]
    );

    if (!result.rows.length)
      return res.status(404).json({ error: "Booking not found." });

    const booking = result.rows[0];

    // ── Respond immediately ───────────────────────────────────────────────
    res.json({ message: "Status updated.", booking });

    // ── Fire confirmation notifications in background ─────────────────────
    if (status === "confirmed") {
      safeSend(sendBookingConfirmed,   booking); // email → customer
      safeSend(sendWhatsAppToCustomer, booking); // WhatsApp → customer
    }

  } catch (err) {
    console.error("❌ updateBookingStatus error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createBooking, getAllBookings, updateBookingStatus };