const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Dentist = require("../models/Dentist");
const generateToken = require("../utils/generateToken");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("../utils/asyncHandler");

const OTP_VALID_MS = 10 * 60 * 1000; // a code is valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // wait 60 seconds between emails

// Generate a new OTP, save its hash on the user, and email the plain code.
// Used by both login and resendOTP so the email is written in one place.
const issueOTP = async (user) => {
  const otp = generateOTP();
  user.otpCode = await bcrypt.hash(otp, 10);
  user.otpExpires = new Date(Date.now() + OTP_VALID_MS);
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Germino Dental - Your Login Verification Code",
    text: `Your one-time verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
    html: `<p>Your one-time verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
  });
};

// Register user
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, licenseNumber, specialization } =
    req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "patient", // public registration ay patient lang palagi
    phone,
  });

  await Patient.create({ user: user._id });

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
});

// Login user - Step 1: verify email/password, then send OTP (does NOT return a token yet)
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error(
      "This account has been deactivated. Please contact the clinic.",
    );
  }

  // Password is correct — generate a one-time code and email it before issuing a token
  await issueOTP(user);

  res.status(200).json({
    success: true,
    message:
      "Password verified. A verification code has been sent to your email.",
    data: {
      email: user.email, // frontend needs this to know which account to verify next
    },
  });
});

// Login user - Step 1b: send a NEW code (only right after a successful password step)
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Only accept a plain string, so an object like { "$ne": null } can't be used in the query
  const user =
    typeof email === "string" && email
      ? await User.findOne({ email }).select("+otpCode +otpExpires")
      : null;

  // Only someone who just passed the password step (valid, unexpired code) can resend.
  // Unknown emails get the same message, so this doesn't reveal which emails exist.
  if (
    !user ||
    !user.otpCode ||
    !user.otpExpires ||
    user.otpExpires < new Date()
  ) {
    res.status(400);
    throw new Error("Your code has expired. Please log in again.");
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error(
      "This account has been deactivated. Please contact the clinic.",
    );
  }

  // Cooldown: when the last code was sent = otpExpires - validity window
  const sentAt = user.otpExpires.getTime() - OTP_VALID_MS;
  const waitMs = RESEND_COOLDOWN_MS - (Date.now() - sentAt);
  if (waitMs > 0) {
    res.status(429);
    throw new Error(
      `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting a new code.`,
    );
  }

  await issueOTP(user); // the old code stops working because it is overwritten

  res.status(200).json({
    success: true,
    message: "A new verification code has been sent to your email.",
  });
});

// Login user - Step 2: verify the OTP, then return the JWT
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select("+otpCode +otpExpires");

  if (!user) {
    res.status(401);
    throw new Error("Invalid request");
  }

  const isValidOTP = await user.compareOTP(otp);

  if (!isValidOTP) {
    res.status(401);
    throw new Error("Invalid or expired verification code");
  }

  // Clear the OTP so it cannot be reused (one-time use only)
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save();

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  let profile = null;
  if (user.role === "patient") {
    profile = await Patient.findOne({ user: user._id });
  } else if (user.role === "admin") {
    profile = await Dentist.findOne({ user: user._id });
  }

  res.status(200).json({
    success: true,
    data: { user, profile },
  });
});

module.exports = { register, login, getMe, verifyOTP, resendOTP };
