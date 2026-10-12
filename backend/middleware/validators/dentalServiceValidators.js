const { body } = require("express-validator");

const createServiceValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Service name is required")
    .isLength({ max: 100 })
    .withMessage("Service name cannot exceed 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("durationMinutes")
    .notEmpty()
    .withMessage("Duration is required")
    .isInt({ min: 5, max: 480 })
    .withMessage("Duration must be between 5 and 480 minutes"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price cannot be negative"),

  body("category")
    .optional()
    .isIn(["Preventive", "Restorative", "Surgical", "Cosmetic", "Diagnostic"])
    .withMessage("Invalid category"),
];

const updateServiceValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Service name cannot exceed 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("durationMinutes")
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage("Duration must be between 5 and 480 minutes"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price cannot be negative"),

  body("category")
    .optional()
    .isIn(["Preventive", "Restorative", "Surgical", "Cosmetic", "Diagnostic"])
    .withMessage("Invalid category"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),
];

module.exports = { createServiceValidation, updateServiceValidation };
