const { body } = require("express-validator");

const updateProfileValidation = [
  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid date (YYYY-MM-DD)"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other", "prefer_not_to_say"])
    .withMessage("Invalid gender value"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage("Address cannot exceed 250 characters"),

  body("medicalHistory")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Medical history cannot exceed 1000 characters"),

  body("emergencyContact.name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Emergency contact name cannot exceed 100 characters"),

  body("emergencyContact.phone")
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage("Please provide a valid phone number"),
];

module.exports = { updateProfileValidation };
