const pool = require("../config/db");

const getAllCabs = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cabs ORDER BY id DESC");
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ getAllCabs error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const createCab = async (req, res) => {
  const { name, description, category, price, max_capacity, image_url } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Name and price are required" });

  try {
    const result = await pool.query(
      `INSERT INTO cabs (name, description, category, price, max_capacity, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, category, price, max_capacity || null, image_url || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ createCab error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateCab = async (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, max_capacity, image_url } = req.body;
  
  if (!name || !price) return res.status(400).json({ error: "Name and price are required" });

  try {
    const result = await pool.query(
      `UPDATE cabs SET name=$1, description=$2, category=$3, price=$4, max_capacity=$5, image_url=$6 
       WHERE id=$7 RETURNING *`,
      [name, description, category, price, max_capacity || null, image_url || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Cab not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ updateCab error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const toggleCabAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE cabs SET available = NOT available WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Cab not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ toggleCabAvailability error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteCab = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM cabs WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Cab not found" });
    return res.json({ message: "Cab deleted" });
  } catch (err) {
    console.error("❌ deleteCab error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getAllCabs, createCab, updateCab, toggleCabAvailability, deleteCab };
