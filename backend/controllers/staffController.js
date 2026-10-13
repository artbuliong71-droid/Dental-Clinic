const User = require("../models/User");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// GET /api/admin/staff — list all staff accounts
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" })
      .select("name email phone isActive createdAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: staff });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load staff accounts." });
  }
};

// POST /api/admin/staff — admin creates a staff account
const createStaff = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Name, email and password are required.",
        });
    }
    if (!EMAIL_REGEX.test(String(email).trim())) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please enter a valid email address.",
        });
    }
    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include letters and numbers.",
      });
    }
    if (phone && !/^\d{11}$/.test(phone)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Phone number must be exactly 11 digits.",
        });
    }

    const exists = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });
    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already registered." });
    }

    // The password is hashed by the pre("save") hook in the User model.
    // The role is always "staff" — never taken from the request body.
    const staff = await User.create({
      name: String(name).trim(),
      email,
      password,
      phone: phone || undefined,
      role: "staff",
    });

    res.status(201).json({
      success: true,
      message: "Staff account created.",
      data: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already registered." });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create staff account." });
  }
};

module.exports = { getStaff, createStaff };
