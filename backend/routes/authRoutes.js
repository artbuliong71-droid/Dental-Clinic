const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  verifyOTP,
  resendOTP,
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

// Send a new OTP (only works right after a successful password step; 60s cooldown)
router.post("/resend-otp", resendOTP);

router.get("/me", protect, getMe);

module.exports = router;
