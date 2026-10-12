const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: (value) => !value || value < new Date(),
        message: "Date of birth must be in the past",
      },
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [250, "Address cannot exceed 250 characters"],
    },
    medicalHistory: {
      type: String,
      trim: true,
      maxlength: [1000, "Medical history cannot exceed 1000 characters"],
      default: "",
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Patient", patientSchema);
