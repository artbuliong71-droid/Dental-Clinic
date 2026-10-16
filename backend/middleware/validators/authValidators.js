const { body } = require("express-validator");

// Letters (including ñ, é, etc.), spaces, apostrophes, hyphens and periods. No numbers.
const NAME_REGEX = /^\p{L}[\p{L}\s.'-]*$/u;
// Philippine mobile number: 11 digits, starts with 09
const PHONE_REGEX = /^09\d{9}$/;
// Keep the email exactly as typed (only lowercased). The default normalizeEmail() removes the
// dots in Gmail addresses, so "john.doe@gmail.com" would be saved as "johndoe@gmail.com"
// and the user could no longer log in by typing the dot.
const EMAIL_OPTIONS = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
};

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2-100 characters")
    .bail()
    .matches(NAME_REGEX)
    .withMessage(
      "Name can only contain letters, spaces, apostrophes, hyphens and periods",
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(EMAIL_OPTIONS),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .bail()
    .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .withMessage("Password must include both letters and numbers"),

  // 'admin' at 'staff' ay sinadyang hindi isinama dito — walang puwedeng mag-self-register
  // bilang admin o staff. Ang admin ay galing sa seed script (utils/seedStaff.js);
  // ang staff ay ginagawa ng admin sa dashboard.
  body("role").optional().isIn(["patient"]).withMessage("Role must be patient"),

  // Optional (an empty string is allowed). If filled in: 11 digits, starts with 09.
  body("phone")
    .optional({ checkFalsy: true })
    .matches(PHONE_REGEX)
    .withMessage("Phone number must be 11 digits and start with 09"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(EMAIL_OPTIONS),

  body("password").notEmpty().withMessage("Password is required"),
];

const verifyOTPValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(EMAIL_OPTIONS),

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
