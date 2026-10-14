const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Dentist = require("../models/Dentist");
const DentalService = require("../models/DentalService");
const asyncHandler = require("../utils/asyncHandler");
const { isClosed } = require("../utils/clinicSchedule");

// @desc    Patient books a new appointment
// @route   POST /api/appointments
const createAppointment = asyncHandler(async (req, res) => {
  const { dentist, service, appointmentDate, appointmentTime, reason } =
    req.body;

  // Kunin ang Patient profile ng naka-login na user (req.user galing sa 'protect' middleware)
  const patientProfile = await Patient.findOne({ user: req.user._id });
  if (!patientProfile) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  // I-verify na existing ang dentist at service na pinili
  const dentistExists = await Dentist.findById(dentist);
  if (!dentistExists) {
    res.status(404);
    throw new Error("Dentist not found");
  }

  const serviceExists = await DentalService.findById(service);
  if (!serviceExists || !serviceExists.isActive) {
    res.status(404);
    throw new Error("Dental service not found or no longer offered");
  }
  const closure = await isClosed(appointmentDate);
  if (closure.closed) {
    res.status(400);
    throw new Error(`The clinic is closed on this date (${closure.reason}).`);
  }

  // I-check kung may existing na appointment na sa parehong dentist, petsa, at oras (double-booking check)
  const conflict = await Appointment.findOne({
    dentist,
    appointmentDate,
    appointmentTime,
    status: { $in: ["Pending", "Confirmed"] },
  });
  if (conflict) {
    res.status(409);
    throw new Error(
      "This time slot is already booked for the selected dentist",
    );
  }

  const appointment = await Appointment.create({
    patient: patientProfile._id,
    dentist,
    service,
    appointmentDate,
    appointmentTime,
    reason,
  });

  res
    .status(201)
    .json({ success: true, message: "Appointment booked", data: appointment });
});
// @desc    Patient views their own appointments
// @route   GET /api/appointments/my
const getMyAppointments = asyncHandler(async (req, res) => {
  const patientProfile = await Patient.findOne({ user: req.user._id });
  if (!patientProfile) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  const appointments = await Appointment.find({ patient: patientProfile._id })
    .populate("dentist", "specialization")
    .populate({ path: "dentist", populate: { path: "user", select: "name" } })
    .populate("service", "name price durationMinutes")
    .sort("-appointmentDate");

  res
    .status(200)
    .json({ success: true, count: appointments.length, data: appointments });
});

// @desc    Admin/Staff view ALL appointments (with optional filters)
// @route   GET /api/appointments
const getAllAppointments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.dentist) filter.dentist = req.query.dentist;

  const appointments = await Appointment.find(filter)
    .populate({
      path: "patient",
      populate: { path: "user", select: "name email phone" },
    })
    .populate({ path: "dentist", populate: { path: "user", select: "name" } })
    .populate("service", "name price durationMinutes")
    .sort("-appointmentDate");

  res
    .status(200)
    .json({ success: true, count: appointments.length, data: appointments });
});

// @desc    Get a single appointment by ID (owner patient, or admin/staff)
// @route   GET /api/appointments/:id
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({
      path: "patient",
      populate: { path: "user", select: "name email phone" },
    })
    .populate({ path: "dentist", populate: { path: "user", select: "name" } })
    .populate("service", "name price durationMinutes");

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  // Kung patient ang naka-login, siguraduhin na SARILI niyang appointment lang ang makikita niya
  if (req.user.role === "patient") {
    const patientProfile = await Patient.findOne({ user: req.user._id });
    if (
      !patientProfile ||
      appointment.patient._id.toString() !== patientProfile._id.toString()
    ) {
      res.status(403);
      throw new Error("Not authorized to view this appointment");
    }
  }

  res.status(200).json({ success: true, data: appointment });
});
// @desc    Admin/Staff updates appointment status (Confirmed, Completed, Cancelled)
// @route   PATCH /api/appointments/:id/status
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  appointment.status = status;
  if (status === "Cancelled" && req.body.cancellationReason) {
    appointment.cancellationReason = req.body.cancellationReason;
  }

  await appointment.save();

  res.status(200).json({
    success: true,
    message: "Appointment status updated",
    data: appointment,
  });
});

// @desc    Patient reschedules their own appointment
// @route   PATCH /api/appointments/:id/reschedule
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointmentDate, appointmentTime } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  // Siguraduhin na sariling appointment lang ng patient ang kanyang mare-reschedule
  const patientProfile = await Patient.findOne({ user: req.user._id });
  if (
    !patientProfile ||
    appointment.patient.toString() !== patientProfile._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to reschedule this appointment");
  }

  // Hindi na puwedeng i-reschedule kung tapos na o kanselado na
  if (["Completed", "Cancelled"].includes(appointment.status)) {
    res.status(400);
    throw new Error(
      `Cannot reschedule an appointment that is already ${appointment.status.toLowerCase()}`,
    );
  }

  // I-check ulit kung may conflict sa bagong petsa/oras (parehong logic ng createAppointment)
  const conflict = await Appointment.findOne({
    _id: { $ne: appointment._id }, // huwag isama ang sarili niya sa check
    dentist: appointment.dentist,
    appointmentDate,
    appointmentTime,
    status: { $in: ["Pending", "Confirmed"] },
  });
  if (conflict) {
    res.status(409);
    throw new Error(
      "This time slot is already booked for the selected dentist",
    );
  }

  appointment.appointmentDate = appointmentDate;
  appointment.appointmentTime = appointmentTime;
  appointment.status = "Pending"; // kailangan ulit ma-confirm pagkatapos ma-reschedule

  await appointment.save();

  res.status(200).json({
    success: true,
    message: "Appointment rescheduled",
    data: appointment,
  });
});

// @desc    Patient cancels their own appointment
// @route   DELETE /api/appointments/:id
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  const patientProfile = await Patient.findOne({ user: req.user._id });
  if (
    !patientProfile ||
    appointment.patient.toString() !== patientProfile._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to cancel this appointment");
  }

  if (appointment.status === "Completed") {
    res.status(400);
    throw new Error("Cannot cancel an appointment that is already completed");
  }

  appointment.status = "Cancelled";
  appointment.cancellationReason =
    req.body.cancellationReason || "Cancelled by patient";
  await appointment.save();

  res.status(200).json({
    success: true,
    message: "Appointment cancelled",
    data: appointment,
  });
});

module.exports = {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
};
