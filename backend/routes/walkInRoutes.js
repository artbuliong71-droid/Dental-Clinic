const express = require("express");
const router = express.Router();
const {
  searchPatients,
  createWalkIn,
  registerPatient,
} = require("../controllers/walkInController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { auditEvent } = require("../utils/AuditLog");

router.get("/patients", protect, authorize("admin", "staff"), searchPatients);
router.post(
  "/patients",
  protect,
  authorize("admin", "staff"),
  auditEvent("patient-registered"),
  registerPatient,
);
router.post(
  "/appointments",
  protect,
  authorize("admin", "staff"),
  createWalkIn,
);

module.exports = router;
