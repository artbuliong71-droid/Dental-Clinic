const mongoose = require("mongoose");
const User = require("../models/User");
const Patient = require("../models/Patient");

// GET /api/admin/patients — list all patient accounts
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate(
      "user",
      "name email phone createdAt",
    );

    const data = patients
      .filter((p) => p.user) // skip orphaned patient records
      .map((p) => ({
        _id: p.user._id, // the User id (used for delete)
        patientId: p._id, // the Patient id (used to count appointments)
        name: p.user.name,
        email: p.user.email,
        phone: p.user.phone,
        createdAt: p.user.createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load patients." });
  }
};

// DELETE /api/admin/accounts/:id — delete a staff or patient account
// Deleting a patient also deletes their patient profile and all their appointments.
const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid account id." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found." });
    }

    // Admin accounts can't be deleted here (so the owner can never delete themselves)
    if (!["staff", "patient"].includes(user.role)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Admin accounts can't be deleted here.",
        });
    }

    let deletedAppointments = 0;

    if (user.role === "patient") {
      const patient = await Patient.findOne({ user: user._id });
      if (patient) {
        // Uses the "appointments" collection directly, so no Appointment model import is needed
        const result = await mongoose.connection
          .collection("appointments")
          .deleteMany({ patient: patient._id });
        deletedAppointments = result.deletedCount;

        await Patient.deleteOne({ _id: patient._id });
      }
    }

    await User.deleteOne({ _id: user._id });

    res.json({
      success: true,
      message: "Account deleted.",
      data: { deletedAppointments },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete the account." });
  }
};

module.exports = { getPatients, deleteAccount };
