const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("../utils/asyncHandler");

const RESET_VALID_MS = 10 * 60 * 1000; // a reset code is valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // at most one email per minute
const MAX_ATTEMPTS = 5; // wrong codes allowed before the code is thrown away

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_REGEX = /^\d{6}$/;

// Same answer whether or not the email is registered, so nobody can use this form
// to find out which emails have an account.
const SAME_ANSWER =
  "If that email is registered, a 6-digit code has been sent to it.";

// The User model needs these fields (see the setup steps). Without them nothing would be saved.
const modelIsReady = () =>
  ["resetCode", "resetExpires", "resetAttempts"].every((field) =>
    User.schema.path(field),
  );

const requireModelFields = (res) => {
  if (!modelIsReady()) {
    res.status(500);
    throw new Error(
      "Password reset is not set up yet: add the reset fields to the User model.",
    );
  }
};

// POST /api/auth/forgot-password   body: { email }
const forgotPassword = asyncHandler(async (req, res) => {
  requireModelFields(res);

  const { email } = req.body;
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    res.status(400);
    throw new Error("Please enter a valid email address.");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+resetExpires",
  );

  if (user && user.isActive) {
    // When was the last code sent? (expiry minus the validity window)
    const lastSent = user.resetExpires
      ? user.resetExpires.getTime() - RESET_VALID_MS
      : 0;

    if (Date.now() - lastSent >= RESEND_COOLDOWN_MS) {
      const code = generateOTP();
      user.resetCode = await bcrypt.hash(code, 10);
      user.resetExpires = new Date(Date.now() + RESET_VALID_MS);
      user.resetAttempts = 0;
      await user.save();

      // Not awaited: the response takes the same time for every email
      sendEmail({
        to: user.email,
        subject: "Germino-Punzal Dental - Reset your password",
        text: `Your password reset code is: ${code}\n\nThis code expires in 10 minutes. If you did not ask to reset your password, you can ignore this email.`,
        html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p><p>If you did not ask to reset your password, you can ignore this email.</p>`,
      }).catch((err) =>
        console.error("Password reset email failed:", err.message),
      );
    }
  }

  res.status(200).json({ success: true, message: SAME_ANSWER });
});

// POST /api/auth/reset-password   body: { email, code, password }
const resetPassword = asyncHandler(async (req, res) => {
  requireModelFields(res);

  const { email, code, password } = req.body;

  if (
    typeof email !== "string" ||
    typeof code !== "string" ||
    typeof password !== "string"
  ) {
    res.status(400);
    throw new Error("Email, code and new password are required.");
  }
  if (!CODE_REGEX.test(code)) {
    res.status(400);
    throw new Error("The code must be 6 digits.");
  }
  if (
    password.length < 8 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    res.status(400);
    throw new Error(
      "Password must be at least 8 characters and include letters and numbers.",
    );
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+resetCode +resetExpires +resetAttempts +otpCode +otpExpires",
  );

  // One message for "no such user", "no code", and "expired", so nothing is revealed
  const invalid = () => {
    res.status(400);
    return new Error("Invalid or expired code. Please request a new one.");
  };

  if (
    !user ||
    !user.isActive ||
    !user.resetCode ||
    !user.resetExpires ||
    user.resetExpires < new Date()
  ) {
    throw invalid();
  }

  if ((user.resetAttempts || 0) >= MAX_ATTEMPTS) {
    res.status(429);
    throw new Error("Too many incorrect attempts. Please request a new code.");
  }

  const matches = await bcrypt.compare(code, user.resetCode);
  if (!matches) {
    user.resetAttempts = (user.resetAttempts || 0) + 1;
    if (user.resetAttempts >= MAX_ATTEMPTS) {
      user.resetCode = undefined; // too many wrong guesses: the code is thrown away
      user.resetExpires = undefined;
    }
    await user.save();
    throw invalid();
  }

  // Success. The password is hashed by the pre("save") hook in the User model.
  user.password = password;
  user.resetCode = undefined;
  user.resetExpires = undefined;
  user.resetAttempts = 0;
  user.otpCode = undefined; // also cancel any login code that was waiting
  user.otpExpires = undefined;
  user.passwordChangedAt = new Date(); // lets the server reject tokens issued before this moment
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Password updated. You can now log in." });
});

module.exports = { forgotPassword, resetPassword };
