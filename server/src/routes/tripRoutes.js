const express = require("express");
const router = express.Router();
const { getAllTrips, getTripById } = require("../controllers/tripController");

router.get("/",    getAllTrips);   // GET /api/trips
router.get("/:id", getTripById);  // GET /api/trips/:id

module.exports = router;
