const express = require("express");
const router = express.Router();
const {
  searchPatients,
  createWalkIn,
} = require("../controllers/walkInController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/patients", protect, authorize("admin", "staff"), searchPatients);
router.post(
  "/appointments",
  protect,
  authorize("admin", "staff"),
  createWalkIn,
);

module.exports = router;
