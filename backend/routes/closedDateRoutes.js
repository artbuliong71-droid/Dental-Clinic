const express = require("express");
const router = express.Router();
const {
  getClosedDates,
  checkClosedDate,
  addClosedDate,
  deleteClosedDate,
} = require("../controllers/closedDateController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Lahat ng naka-login (patient, staff, admin) puwedeng tumingin
router.get("/", protect, getClosedDates);
router.get("/check", protect, checkClosedDate);

// Admin lang ang magdagdag/magbura
router.post("/", protect, authorize("admin"), addClosedDate);
router.delete("/:id", protect, authorize("admin"), deleteClosedDate);

module.exports = router;
