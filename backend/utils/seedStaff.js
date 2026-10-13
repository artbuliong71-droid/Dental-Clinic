require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Dentist = require("../models/Dentist");

// Seeds ONLY the owner (admin) account.
// Staff accounts (secretary, etc.) are now created by the admin
// from the dashboard: Staff Accounts > Create a staff account.
const seedAdmin = async () => {
  await connectDB();

  // --- Owner account (role: admin, siya rin ang dentist, FULL control) ---
  const ownerEmail = process.env.OWNER_EMAIL || "owner@germinodental.com";
  const existingOwner = await User.findOne({ email: ownerEmail });

  if (existingOwner) {
    console.log("Owner (admin) account already exists, skipping.");
  } else {
    const owner = await User.create({
      name: "Dr. Germino",
      email: ownerEmail,
      // Better: put OWNER_PASSWORD in your .env instead of keeping it in code
      password: process.env.OWNER_PASSWORD || "OwnerPass123", // palitan pagkatapos mag-login
      role: "admin",
      phone: "09171234567",
    });

    // Kahit "admin" ang role (para sa permissions), may Dentist profile pa rin siya
    // para makita siya sa booking page ng mga patient.
    await Dentist.create({
      user: owner._id,
      licenseNumber: "PRC-00001",
      specialization: "General Dentistry",
    });

    console.log("Owner (admin) account created:", ownerEmail);
  }

  console.log("Seeding complete.");
  await mongoose.disconnect();
  process.exit(0);
};

seedAdmin();
