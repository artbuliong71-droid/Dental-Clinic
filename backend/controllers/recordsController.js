const mongoose = require("mongoose");
const Patient = require("../models/Patient");
const ClinicalNote = require("../models/ClinicalNote");

const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const text = (v, max) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const GENDERS = ["", "male", "female", "other", "prefer_not_to_say"];

// Patient document -> the shape the frontend form uses
const toProfile = (p) => ({
  birthdate: p.dateOfBirth || null,
  gender: p.gender || "",
  address: p.address || "",
});

// Validate + clean the form values
const parseProfile = (body) => {
  const data = {
    gender: text(body.gender, 30),
    address: text(body.address, 250),
    birthdate: null,
  };

  if (!GENDERS.includes(data.gender)) return { error: "Invalid gender." };

  if (body.birthdate) {
    const d = new Date(body.birthdate);
    if (isNaN(d) || d >= new Date() || d.getFullYear() < 1900) {
      return { error: "Please enter a valid birthdate." };
    }
    data.birthdate = d;
  }
  return { data };
};

// Form values -> a MongoDB update for the Patient document
const buildUpdate = (data) => {
  const update = { $set: { address: data.address }, $unset: {} };
  // Empty gender/birthdate are removed instead of saved as ""
  if (data.gender) update.$set.gender = data.gender;
  else update.$unset.gender = "";
  if (data.birthdate) update.$set.dateOfBirth = data.birthdate;
  else update.$unset.dateOfBirth = "";
  return update;
};

const saveProfileFor = async (userId, body, res) => {
  const { data, error } = parseProfile(body);
  if (error) return fail(res, 400, error);

  const patient = await Patient.findOneAndUpdate(
    { user: userId },
    buildUpdate(data),
    {
      new: true,
      runValidators: true,
    },
  );
  if (!patient) return fail(res, 404, "Patient not found.");

  res.json({ success: true, data: toProfile(patient) });
};

/* ---------------- Patient (own record) ---------------- */

// GET /api/records/me
const getMyRecord = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    // Patients never see the dentist's private notes
    const notes = await ClinicalNote.find({ user: req.user._id }).select(
      "-internalNotes -createdBy",
    );
    res.json({
      success: true,
      data: { profile: patient ? toProfile(patient) : null, notes },
    });
  } catch (error) {
    fail(res, 500, "Failed to load your records.");
  }
};

// PUT /api/records/me/profile
const updateMyProfile = async (req, res) => {
  try {
    await saveProfileFor(req.user._id, req.body, res);
  } catch (error) {
    fail(res, 500, "Failed to save your profile.");
  }
};

/* ---------------- Admin (any patient) ---------------- */

// GET /api/records/patients/:userId
const getPatientRecord = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isId(userId)) return fail(res, 400, "Invalid patient id.");

    const patient = await Patient.findOne({ user: userId });
    if (!patient) return fail(res, 404, "Patient not found.");

    const notes = await ClinicalNote.find({ user: userId });
    res.json({ success: true, data: { profile: toProfile(patient), notes } });
  } catch (error) {
    fail(res, 500, "Failed to load the patient record.");
  }
};

// PUT /api/records/patients/:userId/profile
const updatePatientProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isId(userId)) return fail(res, 400, "Invalid patient id.");
    await saveProfileFor(userId, req.body, res);
  } catch (error) {
    fail(res, 500, "Failed to save the patient information.");
  }
};

// PUT /api/records/appointments/:appointmentId/note   body: { patientUserId, diagnosis, ... }
const saveClinicalNote = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { patientUserId } = req.body;

    if (!isId(appointmentId) || !isId(patientUserId))
      return fail(res, 400, "Invalid id.");

    const patient = await Patient.findOne({ user: patientUserId });
    if (!patient) return fail(res, 404, "Patient not found.");

    // The appointment must belong to this patient
    const appointment = await mongoose.connection
      .collection("appointments")
      .findOne({
        _id: new mongoose.Types.ObjectId(appointmentId),
        patient: patient._id,
      });
    if (!appointment)
      return fail(res, 404, "Appointment not found for this patient.");

    if (!["Confirmed", "Completed"].includes(appointment.status)) {
      return fail(
        res,
        400,
        "Notes can only be added to confirmed or completed appointments.",
      );
    }

    const fields = {
      diagnosis: text(req.body.diagnosis, 1000),
      treatment: text(req.body.treatment, 1000),
      toothNumber: text(req.body.toothNumber, 50),
      prescription: text(req.body.prescription, 1000),
      internalNotes: text(req.body.internalNotes, 1000),
      followUpDate: null,
    };

    if (!fields.diagnosis && !fields.treatment) {
      return fail(res, 400, "Enter a diagnosis or the treatment done.");
    }

    if (req.body.followUpDate) {
      const d = new Date(req.body.followUpDate);
      if (isNaN(d))
        return fail(res, 400, "Please enter a valid follow-up date.");
      fields.followUpDate = d;
    }

    const note = await ClinicalNote.findOneAndUpdate(
      { appointment: appointmentId },
      { $set: { ...fields, user: patientUserId, createdBy: req.user._id } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    res.json({ success: true, data: note });
  } catch (error) {
    fail(res, 500, "Failed to save the clinical notes.");
  }
};

module.exports = {
  getMyRecord,
  updateMyProfile,
  getPatientRecord,
  updatePatientProfile,
  saveClinicalNote,
};
