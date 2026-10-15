const express = require("express");
const router = express.Router();

const {
  getMyRecord,
  updateMyProfile,
  getPatientRecord,
  updatePatientProfile,
  saveClinicalNote,
} = require("../controllers/recordsController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Patient: own record only
router.get("/me", protect, authorize("patient"), getMyRecord);
router.put("/me/profile", protect, authorize("patient"), updateMyProfile);

// Admin (dentist/owner): any patient's record. Staff has NO access.
router.get("/patients/:userId", protect, authorize("admin"), getPatientRecord);
router.put(
  "/patients/:userId/profile",
  protect,
  authorize("admin"),
  updatePatientProfile,
);
router.put(
  "/appointments/:appointmentId/note",
  protect,
  authorize("admin"),
  saveClinicalNote,
);

module.exports = router;
