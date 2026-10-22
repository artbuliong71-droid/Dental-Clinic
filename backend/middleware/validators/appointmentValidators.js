const { body } = require("express-validator");

const createAppointmentValidation = [
  body("dentist")
    .notEmpty()
    .withMessage("Dentist is required")
    .isMongoId()
    .withMessage("Invalid dentist ID"),

  body("service")
    .notEmpty()
    .withMessage("Dental service is required")
    .isMongoId()
    .withMessage("Invalid service ID"),

  body("appointmentDate")
    .notEmpty()
    .withMessage("Appointment date is required")
    .isISO8601()
    .withMessage("Appointment date must be a valid date (YYYY-MM-DD)"),

  body("appointmentTime")
    .notEmpty()
    .withMessage("Appointment time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Appointment time must be in HH:mm format"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

// A reason is required when the patient reschedules or cancels
const requiredReason = (field) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage("Please give a reason")
    .isLength({ min: 3, max: 300 })
    .withMessage("Reason must be between 3 and 300 characters");

const rescheduleValidation = [
  body("appointmentDate")
    .notEmpty()
    .withMessage("Appointment date is required")
    .isISO8601()
    .withMessage("Appointment date must be a valid date (YYYY-MM-DD)"),

  body("appointmentTime")
    .notEmpty()
    .withMessage("Appointment time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Appointment time must be in HH:mm format"),

  // Optional: the patient can also switch to a different service
  body("service").optional().isMongoId().withMessage("Invalid service ID"),

  requiredReason("rescheduleReason"),
];

const cancelValidation = [requiredReason("cancellationReason")];

const updateStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["Pending", "Confirmed", "Completed", "Cancelled"])
    .withMessage("Invalid status value"),

  body("cancellationReason")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Cancellation reason cannot exceed 300 characters"),
];

module.exports = {
  createAppointmentValidation,
  rescheduleValidation,
  cancelValidation,
  updateStatusValidation,
};
