const Dentist = require("../models/Dentist");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Public-facing list of dentists (para sa booking page)
// @route   GET /api/dentists
const getDentists = asyncHandler(async (req, res) => {
  const dentists = await Dentist.find({ isAvailable: true })
    .populate("user", "name")
    .sort("specialization");

  res
    .status(200)
    .json({ success: true, count: dentists.length, data: dentists });
});

// @desc    Get a single dentist's details
// @route   GET /api/dentists/:id
const getDentistById = asyncHandler(async (req, res) => {
  const dentist = await Dentist.findById(req.params.id).populate(
    "user",
    "name",
  );

  if (!dentist) {
    res.status(404);
    throw new Error("Dentist not found");
  }

  res.status(200).json({ success: true, data: dentist });
});

// @desc    Dentist (Admin role) views their own profile/schedule
// @route   GET /api/dentists/me
const getMyDentistProfile = asyncHandler(async (req, res) => {
  const profile = await Dentist.findOne({ user: req.user._id }).populate(
    "user",
    "name email phone",
  );

  if (!profile) {
    res.status(404);
    throw new Error("Dentist profile not found");
  }

  res.status(200).json({ success: true, data: profile });
});

// @desc    Dentist (Admin role) updates their own schedule/specialization
// @route   PATCH /api/dentists/me
const updateMyDentistProfile = asyncHandler(async (req, res) => {
  const profile = await Dentist.findOne({ user: req.user._id });

  if (!profile) {
    res.status(404);
    throw new Error("Dentist profile not found");
  }

  const {
    specialization,
    yearsOfExperience,
    bio,
    availableSchedule,
    isAvailable,
  } = req.body;

  if (specialization !== undefined) profile.specialization = specialization;
  if (yearsOfExperience !== undefined)
    profile.yearsOfExperience = yearsOfExperience;
  if (bio !== undefined) profile.bio = bio;
  if (availableSchedule !== undefined)
    profile.availableSchedule = availableSchedule;
  if (isAvailable !== undefined) profile.isAvailable = isAvailable;

  await profile.save();

  res
    .status(200)
    .json({ success: true, message: "Profile updated", data: profile });
});

module.exports = {
  getDentists,
  getDentistById,
  getMyDentistProfile,
  updateMyDentistProfile,
};
