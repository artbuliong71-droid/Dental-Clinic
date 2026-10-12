const express = require("express");
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  getAllPatients,
  getPatientById,
} = require("../controllers/patientController");

const {
  updateProfileValidation,
} = require("../middleware/validators/patientValidators");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/authMiddleware");

// Patient — sariling profile
router.get("/me", protect, authorize("patient"), getMyProfile);
router.patch(
  "/me",
  protect,
  authorize("patient"),
  updateProfileValidation,
  validate,
  updateMyProfile,
);

// Admin/Staff — makita ang lahat ng patients
router.get("/", protect, authorize("admin", "staff"), getAllPatients);

// Admin/Staff — makita ang detalye ng isang patient
router.get("/:id", protect, authorize("admin", "staff"), getPatientById);

module.exports = router;
