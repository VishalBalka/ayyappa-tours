const pool = require("../config/db");

const getAllTrips = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trips WHERE available = TRUE ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTripById = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid ID" });
  try {
    const result = await pool.query("SELECT * FROM trips WHERE id = $1", [id]);
    if (!result.rows.length)
      return res.status(404).json({ message: "Trip not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllTripsAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trips ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTrip = async (req, res) => {
  try {
    const {
      title, description, location, category,
      price, max_capacity, image_url, duration,
    } = req.body;
    if (!title || !price)
      return res.status(400).json({ message: "Title and price are required" });
    const result = await pool.query(
      "INSERT INTO trips (title,description,location,category,price,max_capacity,image_url,duration) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [title, description, location, category, price, max_capacity, image_url, duration]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, location, category,
      price, max_capacity, image_url, duration, available,
    } = req.body;
    await pool.query(
      "UPDATE trips SET title=$1,description=$2,location=$3,category=$4,price=$5,max_capacity=$6,image_url=$7,duration=$8,available=$9 WHERE id=$10",
      [title, description, location, category, price, max_capacity, image_url, duration, available, id]
    );
    res.json({ message: "Trip updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleTripAvailability = async (req, res) => {
  try {
    await pool.query(
      "UPDATE trips SET available = NOT available WHERE id = $1",
      [req.params.id]
    );
    res.json({ message: "Availability toggled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTrip = async (req, res) => {
  try {
    await pool.query("DELETE FROM trips WHERE id = $1", [req.params.id]);
    res.json({ message: "Trip deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllTrips,
  getTripById,
  getAllTripsAdmin,
  createTrip,
  updateTrip,
  toggleTripAvailability,
  deleteTrip,
};
