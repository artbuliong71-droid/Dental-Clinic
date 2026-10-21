const mongoose = require("mongoose");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Dentist = require("../models/Dentist");
const DentalService = require("../models/DentalService");
const Appointment = require("../models/Appointment");
const asyncHandler = require("../utils/asyncHandler");
const { isClosed, isValidSlot } = require("../utils/clinicSchedule");
const { notifyAppointmentStatus } = require("../utils/appointmentNotifier");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Staff/Admin searches existing patient accounts
// @route   GET /api/walk-in/patients?q=
const searchPatients = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();

  const filter = { role: "patient", isActive: true };
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const users = await User.find(filter)
    .select("name email phone")
    .sort("name")
    .limit(50);

  const profiles = await Patient.find({
    user: { $in: users.map((u) => u._id) },
  }).select("user");
  const profileByUser = new Map(profiles.map((p) => [String(p.user), p._id]));

  const data = users
    .filter((u) => profileByUser.has(String(u._id)))
    .map((u) => ({
      patientId: profileByUser.get(String(u._id)),
      name: u.name,
      email: u.email,
      phone: u.phone || "",
    }));

  res.json({ success: true, count: data.length, data });
});

// @desc    Staff/Admin records a walk-in appointment for an existing patient
// @route   POST /api/walk-in/appointments
const createWalkIn = asyncHandler(async (req, res) => {
  const {
    patientId,
    dentist,
    service,
    appointmentDate,
    appointmentTime,
    reason,
  } = req.body;

  for (const [label, id] of [
    ["patient", patientId],
    ["dentist", dentist],
    ["service", service],
  ]) {
    if (!mongoose.isValidObjectId(id)) {
      res.status(400);
      throw new Error(`A valid ${label} is required.`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(appointmentDate))) {
    res.status(400);
    throw new Error("A valid date (YYYY-MM-DD) is required.");
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const dentistExists = await Dentist.findById(dentist);
  if (!dentistExists) {
    res.status(404);
    throw new Error("Dentist not found");
  }

  const serviceExists = await DentalService.findById(service);
  if (!serviceExists || !serviceExists.isActive) {
    res.status(404);
    throw new Error("Dental service not found or no longer offered");
  }

  const closure = await isClosed(appointmentDate);
  if (closure.closed) {
    res.status(400);
    throw new Error(`The clinic is closed on this date (${closure.reason}).`);
  }

  if (!isValidSlot(appointmentTime)) {
    res.status(400);
    throw new Error("Please choose a time between 9:00 AM and 3:00 PM.");
  }

  const conflict = await Appointment.findOne({
    dentist,
    appointmentDate,
    appointmentTime,
    status: { $in: ["Pending", "Confirmed"] },
  });
  if (conflict) {
    res.status(409);
    throw new Error(
      "This time slot is already booked for the selected dentist",
    );
  }

  const appointment = await Appointment.create({
    patient: patient._id,
    dentist,
    service,
    appointmentDate,
    appointmentTime,
    reason,
    status: "Confirmed", // walk-in: nandiyan na ang patient
    source: "walk-in",
    createdBy: req.user._id,
  });

  // In-app notification (+ email) para sa patient
  try {
    await notifyAppointmentStatus(appointment);
  } catch (err) {
    console.error("Notification error:", err.message);
  }

  res.status(201).json({
    success: true,
    message: "Walk-in appointment recorded",
    data: appointment,
  });
});

module.exports = { searchPatients, createWalkIn };
