const pool   = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { sendAdminLoginAlert } = require("../services/emailService");

// ── Cookie config ─────────────────────────────────────────────────────────
const COOKIE_NAME = "adminToken";
const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge:   2 * 60 * 60 * 1000, // 2 hours
  path:     "/",
};

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is not set in .env");
  process.exit(1);
}

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
      await bcrypt.compare(password, "$2a$10$XXXXXXXXXXXXXXXXXXXXXX"); // timing attack prevention
    }

    if (admin) {
      pool.query(
        "INSERT INTO login_logs (admin_id, ip_address, success) VALUES ($1,$2,$3)",
        [admin.id, ip, match]
      ).catch(() => {});
    }

    if (!admin || !match)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" }
    );

    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
    sendAdminLoginAlert(username, ip).catch(() => {});

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
    const [total, pending, confirmed, cancelled, activeTrips, activePlaces, recent] =
      await Promise.all([
        pool.query("SELECT COUNT(*) FROM bookings"),
        pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'pending'"),
        pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'"),
        pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'cancelled'"),
        pool.query("SELECT COUNT(*) FROM trips WHERE available = TRUE"),
        pool.query("SELECT COUNT(*) FROM places WHERE active = TRUE"),
        pool.query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5"),
      ]);

    return res.json({
      total_bookings:    parseInt(total.rows[0].count),
      pending_bookings:  parseInt(pending.rows[0].count),
      confirmed_bookings: parseInt(confirmed.rows[0].count),
      cancelled_bookings: parseInt(cancelled.rows[0].count),
      active_trips:      parseInt(activeTrips.rows[0].count),
      active_places:     parseInt(activePlaces.rows[0].count),
      recent_bookings:   recent.rows,
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

// ── Places CRUD ───────────────────────────────────────────────────────────

const getAllPlaces = async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM places ORDER BY sort_order ASC, created_at DESC"
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ getAllPlaces error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getPublicPlaces = async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM places WHERE active = TRUE ORDER BY sort_order ASC, created_at DESC"
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ getPublicPlaces error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const createPlace = async (req, res) => {
  const { name, description, image_url, tag, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: "Place name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO places (name, description, image_url, tag, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        name.trim(),
        description?.trim() || null,
        image_url?.trim() || null,
        tag?.trim() || null,
        sort_order || 0,
      ]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ createPlace error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updatePlace = async (req, res) => {
  const { id } = req.params;
  const { name, description, image_url, tag, sort_order, active } = req.body;
  if (!name) return res.status(400).json({ error: "Place name is required" });

  try {
    const result = await pool.query(
      `UPDATE places
       SET name=$1, description=$2, image_url=$3, tag=$4, sort_order=$5, active=$6
       WHERE id=$7 RETURNING *`,
      [
        name.trim(),
        description?.trim() || null,
        image_url?.trim() || null,
        tag?.trim() || null,
        sort_order ?? 0,
        active ?? true,
        id,
      ]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Place not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ updatePlace error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const togglePlaceActive = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE places SET active = NOT active WHERE id = $1 RETURNING *",
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Place not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ togglePlaceActive error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deletePlace = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM places WHERE id = $1 RETURNING id", [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Place not found" });
    return res.json({ message: "Place deleted" });
  } catch (err) {
    console.error("❌ deletePlace error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  adminLogin, adminLogout,
  getStats, getLoginLogs,
  getAllPlaces, getPublicPlaces, createPlace, updatePlace, togglePlaceActive, deletePlace,
};