const pool = require("../config/db");
const calculatePrice = require("../utils/calculatePrice");
const generateReference = require("../utils/generateReference");
const generateWhatsAppLink = require("../services/whatsappService");
const {
  sendBookingReceived,
  sendAdminNewBooking,
  sendBookingConfirmed,
} = require("../services/emailService");

// Safe email helper — never crashes the request
const safeSend = async (fn, ...args) => {
  try {
    await fn(...args);
  } catch (err) {
    console.error("⚠️  Email send failed (non-fatal):", err.message);
  }
};

const createBooking = async (req, res) => {
  try {
    const {
      trip_id, customer_name, customer_email, customer_phone,
      nationality, group_type, persons, travel_date, cab_type, special_requests,
    } = req.body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!trip_id || !customer_name || !customer_email || !persons || !travel_date)
      return res.status(400).json({ error: "Missing required fields" });

    // ── Fetch Trip ────────────────────────────────────────────────────────
    const tripResult = await pool.query("SELECT * FROM trips WHERE id = $1", [trip_id]);
    if (!tripResult.rows.length)
      return res.status(404).json({ error: "Trip not found" });

    const trip = tripResult.rows[0];

    if (!trip.available)
      return res.status(400).json({ error: "Trip is not available" });

    if (Number(persons) > trip.max_capacity)
      return res.status(400).json({ error: `Max capacity is ${trip.max_capacity} persons` });

    // ── Create Booking ────────────────────────────────────────────────────
    const reference  = generateReference();
    const total_price = calculatePrice(trip.price, persons, cab_type);

    const result = await pool.query(
      `INSERT INTO bookings
        (trip_id, reference, customer_name, customer_email, customer_phone,
         nationality, group_type, persons, travel_date, total_price,
         cab_type, special_requests)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        trip_id,
        reference,
        customer_name.trim(),
        customer_email.trim(),
        customer_phone  || null,
        nationality     || null,
        group_type      || null,
        Number(persons),
        travel_date,
        total_price,
        cab_type        || "none",
        special_requests || null,
      ]
    );

    const booking  = result.rows[0];
    const whatsapp = generateWhatsAppLink(reference, trip.title);

    // ── Emails (non-fatal — booking succeeds even if email fails) ─────────
    await safeSend(sendBookingReceived, booking, trip);
    await safeSend(sendAdminNewBooking, booking, trip);

    // ── Respond ───────────────────────────────────────────────────────────
    return res.status(201).json({ booking, whatsapp });

  } catch (err) {
    console.error("❌ createBooking error:", err);
    return res.status(500).json({ error: err.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, t.title AS trip_title, t.location AS trip_location
       FROM bookings b
       LEFT JOIN trips t ON b.trip_id = t.id
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ getAllBookings error:", err);
    res.status(500).json({ error: err.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const result = await pool.query(
      "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (!result.rows.length)
      return res.status(404).json({ error: "Booking not found" });

    const booking = result.rows[0];

    if (status === "confirmed") await safeSend(sendBookingConfirmed, booking);

    res.json({ message: "Status updated", booking });
  } catch (err) {
    console.error("❌ updateBookingStatus error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createBooking, getAllBookings, updateBookingStatus };