const mongoose = require("mongoose");

const scheduleSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Start time must be in HH:mm format",
      ],
    },
    endTime: {
      type: String,
      required: true,
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "End time must be in HH:mm format",
      ],
    },
  },
  { _id: false },
);

const dentistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      trim: true,
      default: "General Dentistry",
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      trim: true,
      unique: true,
    },
    yearsOfExperience: {
      type: Number,
      min: [0, "Years of experience cannot be negative"],
      default: 0,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    availableSchedule: {
      type: [scheduleSlotSchema],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

dentistSchema.index({ specialization: 1 });

module.exports = mongoose.model("Dentist", dentistSchema);
