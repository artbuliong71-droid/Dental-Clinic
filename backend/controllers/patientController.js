const Patient = require("../models/Patient");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Patient views their own full profile
// @route   GET /api/patients/me
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await Patient.findOne({ user: req.user._id }).populate(
    "user",
    "name email phone",
  );

  if (!profile) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  res.status(200).json({ success: true, data: profile });
});

// @desc    Patient updates their own profile
// @route   PATCH /api/patients/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await Patient.findOne({ user: req.user._id });

  if (!profile) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  const { dateOfBirth, gender, address, medicalHistory, emergencyContact } =
    req.body;

  if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
  if (gender !== undefined) profile.gender = gender;
  if (address !== undefined) profile.address = address;
  if (medicalHistory !== undefined) profile.medicalHistory = medicalHistory;
  if (emergencyContact !== undefined)
    profile.emergencyContact = emergencyContact;

  await profile.save();

  res
    .status(200)
    .json({ success: true, message: "Profile updated", data: profile });
});

// @desc    Admin/Staff view ALL patients
// @route   GET /api/patients
const getAllPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find()
    .populate("user", "name email phone isActive")
    .sort("-createdAt");

  res
    .status(200)
    .json({ success: true, count: patients.length, data: patients });
});

// @desc    Admin/Staff view a single patient's details
// @route   GET /api/patients/:id
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate(
    "user",
    "name email phone isActive",
  );

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  res.status(200).json({ success: true, data: patient });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getAllPatients,
  getPatientById,
};
