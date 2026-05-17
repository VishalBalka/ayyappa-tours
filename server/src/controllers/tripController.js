const pool = require("../config/db");

// ── Public ────────────────────────────────────────────────────────────────
const getAllTrips = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trips WHERE available = TRUE ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ getAllTrips error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTripById = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid ID" });
  try {
    const result = await pool.query("SELECT * FROM trips WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Trip not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ getTripById error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────
const getAllTripsAdmin = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM trips ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ getAllTripsAdmin error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createTrip = async (req, res) => {
  try {
    const { title, description, location, category, max_capacity, image_url, duration, available } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const result = await pool.query(
      `INSERT INTO trips (title, description, location, category, max_capacity, image_url, duration, available)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        title.trim(),
        description?.trim() || null,
        location?.trim() || null,
        category || "wildlife",
        max_capacity ? Number(max_capacity) : null,
        image_url?.trim() || null,
        duration?.trim() || null,
        available !== false,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ createTrip error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, category, max_capacity, image_url, duration, available } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const result = await pool.query(
      `UPDATE trips
       SET title=$1, description=$2, location=$3, category=$4,
           max_capacity=$5, image_url=$6, duration=$7, available=$8
       WHERE id=$9 RETURNING *`,
      [
        title.trim(),
        description?.trim() || null,
        location?.trim() || null,
        category || "wildlife",
        max_capacity ? Number(max_capacity) : null,
        image_url?.trim() || null,
        duration?.trim() || null,
        available !== false,
        id,
      ]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Trip not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ updateTrip error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const toggleTripAvailability = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE trips SET available = NOT available WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Trip not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ toggleTripAvailability error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM trips WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Trip not found" });
    res.json({ message: "Trip deleted" });
  } catch (err) {
    console.error("❌ deleteTrip error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getAllTrips, getTripById, getAllTripsAdmin, createTrip, updateTrip, toggleTripAvailability, deleteTrip };