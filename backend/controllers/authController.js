const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Dentist = require("../models/Dentist");
const generateToken = require("../utils/generateToken");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("../utils/asyncHandler");

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
  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, 10);

  user.otpCode = hashedOTP;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 minutes
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Germino Dental - Your Login Verification Code",
    text: `Your one-time verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
    html: `<p>Your one-time verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
  });

  res.status(200).json({
    success: true,
    message:
      "Password verified. A verification code has been sent to your email.",
    data: {
      email: user.email, // frontend needs this to know which account to verify next
    },
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

module.exports = { register, login, getMe, verifyOTP };
