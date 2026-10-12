const express = require("express");
const router = express.Router();

const {
  getDentists,
  getDentistById,
  getMyDentistProfile,
  updateMyDentistProfile,
} = require("../controllers/dentistController");

const {
  updateDentistValidation,
} = require("../middleware/validators/dentistValidators");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/authMiddleware");

// Admin (siya ang dentist) — sariling profile/schedule
// Importante: nasa ITAAS ito ng '/:id' para hindi "makuha" ng :id ang salitang "me"
router.get("/me", protect, authorize("admin"), getMyDentistProfile);
router.patch(
  "/me",
  protect,
  authorize("admin"),
  updateDentistValidation,
  validate,
  updateMyDentistProfile,
);

// Kahit sino, naka-login — makita ang listahan ng mga dentist (booking page)
router.get("/", protect, getDentists);
router.get("/:id", protect, getDentistById);

module.exports = router;
