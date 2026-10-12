const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  verifyOTP,
} = require("../controllers/authController");
const {
  registerValidation,
  loginValidation,
  verifyOTPValidation,
} = require("../middleware/validators/authValidators");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerValidation, validate, register);

router.post("/login", loginValidation, validate, login);

router.post("/verify-otp", verifyOTPValidation, validate, verifyOTP);

router.get("/me", protect, getMe);

module.exports = router;
