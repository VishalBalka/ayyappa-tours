const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getAllCabs, createCab, updateCab,
  toggleCabAvailability, deleteCab
} = require("../controllers/cabController");

// Public routes
router.get("/", getAllCabs);

// Protected routes
router.use(authMiddleware);
router.post("/", createCab);
router.put("/:id", updateCab);
router.patch("/:id/toggle", toggleCabAvailability);
router.delete("/:id", deleteCab);

module.exports = router;
