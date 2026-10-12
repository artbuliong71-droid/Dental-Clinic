const mongoose = require("mongoose");

const dentalServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Service name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [5, "Duration must be at least 5 minutes"],
      max: [480, "Duration cannot exceed 8 hours"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      enum: ["Preventive", "Restorative", "Surgical", "Cosmetic", "Diagnostic"],
      default: "Preventive",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

dentalServiceSchema.index({ isActive: 1 });

module.exports = mongoose.model("DentalService", dentalServiceSchema);
