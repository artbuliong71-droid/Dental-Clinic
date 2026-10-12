const express = require("express");
const router = express.Router();

const {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
} = require("../controllers/appointmentController");

const {
  createAppointmentValidation,
  rescheduleValidation,
  updateStatusValidation,
} = require("../middleware/validators/appointmentValidators");

const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/authMiddleware");

// Patient — mag-book ng bagong appointment
router.post(
  "/",
  protect,
  authorize("patient"),
  createAppointmentValidation,
  validate,
  createAppointment,
);

// Patient — makita ang sariling appointments
router.get("/my", protect, authorize("patient"), getMyAppointments);

// Admin/Staff — makita LAHAT ng appointments
router.get("/", protect, authorize("admin", "staff"), getAllAppointments);

// Kahit sinong naka-login — makita ang detalye ng isang appointment
// (ang object-level check — "sarili ba niya ito" — ay nasa loob mismo ng controller)
router.get("/:id", protect, getAppointmentById);

// Admin/Staff — i-update ang status (approve, complete, atbp.)
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "staff"),
  updateStatusValidation,
  validate,
  updateAppointmentStatus,
);

// Patient — i-reschedule ang sariling appointment
router.patch(
  "/:id/reschedule",
  protect,
  authorize("patient"),
  rescheduleValidation,
  validate,
  rescheduleAppointment,
);

// Patient — i-cancel ang sariling appointment
router.delete("/:id", protect, authorize("patient"), cancelAppointment);

module.exports = router;
