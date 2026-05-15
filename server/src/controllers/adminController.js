const pool   = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { sendAdminLoginAlert } = require("../services/emailService");

// ── Cookie config ─────────────────────────────────────────────────────────
const COOKIE_NAME = "adminToken";
const COOKIE_OPTS = {
  httpOnly:  true,                                    // JS cannot read it
  secure:    process.env.NODE_ENV === "production",   // HTTPS only in prod
  sameSite:  "strict",                                // CSRF protection
  maxAge:    2 * 60 * 60 * 1000,                      // 2 hours (matches JWT)
  path:      "/",
};

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is not set in .env");
  process.exit(1);
}

// ── Helper ────────────────────────────────────────────────────────────────
const getIP = (req) =>
  (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0].trim();

// ── adminLogin ────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  const ip = getIP(req);

  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  try {
    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1", [username]
    );

    const admin = result.rows[0];
    let match = false;
    
    if (admin) {
      match = await bcrypt.compare(password, admin.password_hash);
    } else {
      // Dummy compare to mitigate timing attacks
      await bcrypt.compare(password, "$2a$10$XXXXXXXXXXXXXXXXXXXXXX");
    }

    // Log attempt (success or failure) — fire and forget
    if (admin) {
      pool.query(
        "INSERT INTO login_logs (admin_id, ip_address, success) VALUES ($1,$2,$3)",
        [admin.id, ip, match]
      ).catch(() => {});
    }

    // Always return same message — prevents username enumeration
    if (!admin || !match)
      return res.status(401).json({ error: "Invalid credentials" });

    // Sign JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Set HttpOnly cookie — token never visible in browser JS or console
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

    // Send login alert (non-fatal)
    sendAdminLoginAlert(username, ip).catch(() => {});

    // Return user info and token
    return res.json({ username: admin.username, token });

  } catch (err) {
    console.error("❌ adminLogin error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── adminLogout ───────────────────────────────────────────────────────────
const adminLogout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: 0 });
  return res.json({ message: "Logged out" });
};

// ── getStats ──────────────────────────────────────────────────────────────
const getStats = async (_req, res) => {
  try {
    const [total, pending, confirmed, cancelled, revenue, activeTrips, persons, recent] =
      await Promise.all([
        pool.query("SELECT COUNT(*) FROM bookings"),
        pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'pending'"),
        pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'"),
        pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'cancelled'"),
        pool.query("SELECT COALESCE(SUM(total_price),0) FROM bookings WHERE status = 'confirmed'"),
        pool.query("SELECT COUNT(*) FROM trips WHERE available = TRUE"),
        pool.query("SELECT COALESCE(SUM(persons),0) FROM bookings WHERE status = 'confirmed'"),
        pool.query(`
          SELECT b.*, t.title AS trip_title
          FROM bookings b
          LEFT JOIN trips t ON b.trip_id = t.id
          ORDER BY b.created_at DESC LIMIT 5
        `),
      ]);

    return res.json({
      total_bookings:      parseInt(total.rows[0].count),
      pending_bookings:    parseInt(pending.rows[0].count),
      confirmed_bookings:  parseInt(confirmed.rows[0].count),
      cancelled_bookings:  parseInt(cancelled.rows[0].count),
      total_revenue:       parseFloat(revenue.rows[0].coalesce),
      active_trips:        parseInt(activeTrips.rows[0].count),
      total_persons:       parseInt(persons.rows[0].coalesce),
      recent_bookings:     recent.rows,
    });
  } catch (err) {
    console.error("❌ getStats error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── getLoginLogs ──────────────────────────────────────────────────────────
const getLoginLogs = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, a.username
      FROM login_logs l
      JOIN admins a ON l.admin_id = a.id
      ORDER BY l.created_at DESC
      LIMIT 50
    `);
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ getLoginLogs error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { adminLogin, adminLogout, getStats, getLoginLogs };