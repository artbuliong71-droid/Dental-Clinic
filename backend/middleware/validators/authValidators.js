const { body } = require("express-validator");

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2-100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  // 'admin' at 'staff' ay sinadyang hindi isinama dito — walang puwedeng mag-self-register
  // bilang admin o staff. Ginagawa lang sila sa pamamagitan ng seed script (utils/seedStaff.js).
  body("role").optional().isIn(["patient"]).withMessage("Role must be patient"),

  body("phone")
    .optional()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage("Please provide a valid phone number"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),
];

const verifyOTPValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be 6 digits")
    .isNumeric()
    .withMessage("Verification code must contain numbers only"),
];

module.exports = { registerValidation, loginValidation, verifyOTPValidation };
