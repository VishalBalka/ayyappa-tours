const pool = require("../config/db");

// ── Public ────────────────────────────────────────────────────────────────
const getAllPlaces = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM places WHERE active = TRUE ORDER BY sort_order ASC, id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ getAllPlaces error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────
const getAllPlacesAdmin = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM places ORDER BY sort_order ASC, id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ getAllPlacesAdmin error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createPlace = async (req, res) => {
  const { name, description, image_url, tag, sort_order, active } = req.body;
  if (!name) return res.status(400).json({ error: "Place name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO places (name, description, image_url, tag, sort_order, active)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        name.trim(),
        description?.trim() || null,
        image_url?.trim() || null,
        tag?.trim() || null,
        sort_order ? Number(sort_order) : 0,
        active !== false,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ createPlace error:", err.message);
    res.status(500).json({ error: "Internal server error" });
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
        sort_order ? Number(sort_order) : 0,
        active !== false,
        id,
      ]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Place not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ updatePlace error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const togglePlace = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE places SET active = NOT active WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Place not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ togglePlace error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deletePlace = async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM places WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Place not found" });
    res.json({ message: "Place deleted" });
  } catch (err) {
    console.error("❌ deletePlace error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getAllPlaces, getAllPlacesAdmin, createPlace, updatePlace, togglePlace, deletePlace };