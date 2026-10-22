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
    cancelledAt: { type: Date },

    // Every time the patient moves the appointment (or changes the service),
    // the OLD details and the reason are kept here.
    rescheduleHistory: [
      {
        fromDate: { type: Date, required: true },
        fromTime: { type: String, required: true },
        fromServiceName: { type: String, default: "" },
        reason: {
          type: String,
          trim: true,
          required: true,
          maxlength: [300, "Reason cannot exceed 300 characters"],
        },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // These two were nested inside cancellationReason by mistake, so they were
    // never real fields. They are top-level fields now.
    source: {
      type: String,
      enum: ["online", "walk-in"],
      default: "online",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
