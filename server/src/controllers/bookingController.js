const pool = require("../config/db");
const { sendBookingReceived, sendAdminNewBooking, sendBookingConfirmed } = require("../services/emailService");

const generateReference = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "AYT-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
};

const safeSend = (fn, ...args) => {
  try {
    Promise.resolve(fn(...args)).catch((err) =>
      console.error("Notification failed:", err.message)
    );
  } catch (err) {
    console.error("Notification failed:", err.message);
  }
};

const createBooking = async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, place, travel_date, persons, special_requests } = req.body;

    if (!customer_name?.trim() || !customer_email?.trim() || !travel_date || !persons)
      return res.status(400).json({ error: "Name, email, date and number of persons are required." });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email.trim()))
      return res.status(400).json({ error: "Please enter a valid email address." });

    if (Number(persons) < 1 || Number(persons) > 100)
      return res.status(400).json({ error: "Number of persons must be between 1 and 100." });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(travel_date) < today)
      return res.status(400).json({ error: "Travel date must be today or in the future." });

    const reference = generateReference();

    const result = await pool.query(
      `INSERT INTO bookings (reference, customer_name, customer_email, customer_phone, place, travel_date, persons, special_requests)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [reference, customer_name.trim(), customer_email.trim().toLowerCase(), customer_phone?.trim() || null,
       place?.trim() || null, travel_date, Number(persons), special_requests?.trim() || null]
    );

    const booking = result.rows[0];

    res.status(201).json({ message: "Booking received successfully.", reference: booking.reference, booking });

    safeSend(sendBookingReceived, booking);
    safeSend(sendAdminNewBooking, booking);

  } catch (err) {
    console.error("createBooking error:", err.message);
    return res.status(500).json({ error: "Internal server error. Please try again." });
  }
};

const getAllBookings = async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("getAllBookings error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status))
      return res.status(400).json({ error: "Invalid status value." });

    const result = await pool.query(
      "UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *", [status, id]
    );

    if (!result.rows.length)
      return res.status(404).json({ error: "Booking not found." });

    const booking = result.rows[0];
    res.json({ message: "Status updated.", booking });

    if (status === "confirmed")
      safeSend(sendBookingConfirmed, booking);

  } catch (err) {
    console.error("updateBookingStatus error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createBooking, getAllBookings, updateBookingStatus };
