const mongoose = require("mongoose");

const clinicalNoteSchema = new mongoose.Schema(
  {
    // Ang User id ng pasyente (gamit sa find/deleteMany by user)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Isang note lang bawat appointment (upsert by appointment)
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    // Ang dentist/admin na gumawa ng note
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    diagnosis: { type: String, trim: true, maxlength: 1000, default: "" },
    treatment: { type: String, trim: true, maxlength: 1000, default: "" },
    toothNumber: { type: String, trim: true, maxlength: 50, default: "" },
    prescription: { type: String, trim: true, maxlength: 1000, default: "" },
    // Pribado: hindi ipinapakita sa pasyente
    internalNotes: { type: String, trim: true, maxlength: 1000, default: "" },
    followUpDate: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ClinicalNote", clinicalNoteSchema);
