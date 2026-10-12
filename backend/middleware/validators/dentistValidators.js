const { body } = require("express-validator");

const updateDentistValidation = [
  body("specialization")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Specialization cannot exceed 100 characters"),

  body("yearsOfExperience")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Years of experience cannot be negative"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be true or false"),

  body("availableSchedule")
    .optional()
    .isArray()
    .withMessage("availableSchedule must be an array"),

  body("availableSchedule.*.day")
    .optional()
    .isIn([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ])
    .withMessage("Invalid day value"),

  body("availableSchedule.*.startTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Start time must be in HH:mm format"),

  body("availableSchedule.*.endTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("End time must be in HH:mm format"),
];

module.exports = { updateDentistValidation };
