const express = require("express");
const router = express.Router();
const {
  getAllTrips,
  getTripById,
} = require("../controllers/tripController");

router.get("/", getAllTrips);
router.get("/:id", getTripById);

module.exports = router;