require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

// Updates the existing owner (admin) email/password from your .env
const resetOwner = async () => {
  if (!process.env.OWNER_PASSWORD) {
    console.log("Set OWNER_PASSWORD in your .env first.");
    process.exit(1);
  }

  await connectDB();

  const owner = await User.findOne({ role: "admin" });
  if (!owner) {
    console.log("No admin account found. Run seedStaff.js instead.");
  } else {
    if (process.env.OWNER_EMAIL) owner.email = process.env.OWNER_EMAIL;
    owner.password = process.env.OWNER_PASSWORD; // hashed by the pre("save") hook
    await owner.save();
    console.log("Owner updated:", owner.email);
  }

  await mongoose.disconnect();
  process.exit(0);
};

resetOwner();
