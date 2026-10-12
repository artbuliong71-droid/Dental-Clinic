require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Dentist = require("../models/Dentist");

const seedStaff = async () => {
  await connectDB();

  // --- Owner account (role: admin, siya rin ang dentist, FULL control) ---
  const ownerEmail = "owner@germinodental.com";
  const existingOwner = await User.findOne({ email: ownerEmail });

  if (existingOwner) {
    console.log("Owner (admin) account already exists, skipping.");
  } else {
    const owner = await User.create({
      name: "Dr. Germino",
      email: ownerEmail,
      password: "OwnerPass123", // palitan pagkatapos mag-login
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

  // --- Secretary account (role: staff, LIMITED sa appointments) ---
  const secretaryEmail = "secretary@germinodental.com";
  const existingSecretary = await User.findOne({ email: secretaryEmail });

  if (existingSecretary) {
    console.log("Secretary (staff) account already exists, skipping.");
  } else {
    await User.create({
      name: "Clinic Secretary",
      email: secretaryEmail,
      password: "SecretaryPass123", // palitan pagkatapos mag-login
      role: "staff",
      phone: "09179876543",
    });

    console.log("Secretary (staff) account created:", secretaryEmail);
  }

  console.log("Seeding complete.");
  await mongoose.disconnect();
  process.exit(0);
};

seedStaff();
