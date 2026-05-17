const express = require("express");
const router  = express.Router();
const { getAllPlaces } = require("../controllers/placesController");

// Public — shown on homepage
router.get("/", getAllPlaces);

module.exports = router;