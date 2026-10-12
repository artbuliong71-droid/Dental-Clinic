const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },
    dentist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dentist",
      required: [true, "Dentist is required"],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DentalService",
      required: [true, "Dental service is required"],
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
      validate: {
        validator: function (value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return value >= today;
        },
        message: "Appointment date cannot be in the past",
      },
    },
    appointmentTime: {
      type: String,
      required: [true, "Appointment time is required"],
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Appointment time must be in HH:mm format",
      ],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "Confirmed", "Completed", "Cancelled"],
        message: "{VALUE} is not a valid status",
      },
      default: "Pending",
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [300, "Cancellation reason cannot exceed 300 characters"],
    },
  },
  {
    timestamps: { createdAt: "createdDate", updatedAt: "updatedDate" },
  },
);

appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ dentist: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ dentist: 1, appointmentDate: 1, appointmentTime: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
