const { notifyAppointmentStatus } = require("../utils/appointmentNotifier");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Dentist = require("../models/Dentist");
const DentalService = require("../models/DentalService");
const User = require("../models/User"); // check: adjust the path if your User model is named differently
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const {
  isClosed,
  getAllSlots,
  isValidSlot,
} = require("../utils/clinicSchedule");

/* ---------- helpers ---------- */

const to12h = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
const dateKey = (d) => new Date(d).toISOString().slice(0, 10);

// Tell every admin and staff account that a patient changed or cancelled an appointment.
// Never breaks the request if something goes wrong here.
const notifyClinic = async (appointmentId, type, title, buildMessage) => {
  try {
    const appt = await Appointment.findById(appointmentId)
      .populate({ path: "patient", populate: { path: "user", select: "name" } })
      .populate("service", "name");
    if (!appt) return;

    const people = await User.find({
      role: { $in: ["admin", "staff"] },
    }).select("_id");
    if (people.length === 0) return;

    const who = appt.patient?.user?.name || "A patient";
    const message = buildMessage(who, appt);
    await Notification.insertMany(
      people.map((u) => ({
        user: u._id,
        appointment: appt._id,
        type,
        title,
        message,
      })),
    );
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

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

  // Block kung sarado ang clinic sa petsang iyon
  const closure = await isClosed(appointmentDate);
  if (closure.closed) {
    res.status(400);
    throw new Error(`The clinic is closed on this date (${closure.reason}).`);
  }

  // Dapat nasa oras ng clinic (9:00 AM hanggang 3:00 PM)
  if (!isValidSlot(appointmentTime)) {
    res.status(400);
    throw new Error("Please choose a time between 9:00 AM and 3:00 PM.");
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

// @desc    Available time slots for a dentist on a date
// @route   GET /api/appointments/slots?dentist=ID&date=YYYY-MM-DD
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { dentist, date } = req.query;
  if (!dentist || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    res.status(400);
    throw new Error("Dentist and a valid date (YYYY-MM-DD) are required.");
  }

  const closure = await isClosed(date);
  if (closure.closed) {
    return res.json({
      success: true,
      closed: true,
      reason: closure.reason,
      data: [],
    });
  }

  const taken = await Appointment.find({
    dentist,
    appointmentDate: date,
    status: { $in: ["Pending", "Confirmed"] },
  }).select("appointmentTime");

  const takenTimes = new Set(taken.map((a) => a.appointmentTime));
  const data = getAllSlots().filter((t) => !takenTimes.has(t));

  res.json({ success: true, closed: false, data });
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

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  // Hindi puwedeng i-mark as Completed ang appointment na hindi pa dumarating ang petsa
  if (status === "Completed") {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    }); // YYYY-MM-DD, oras sa Pilipinas
    const apptDay = new Date(appointment.appointmentDate)
      .toISOString()
      .slice(0, 10);
    if (apptDay > today) {
      res.status(400);
      throw new Error(
        "This appointment can only be marked as completed on or after its scheduled date.",
      );
    }
  }

  const previousStatus = appointment.status;

  appointment.status = status;
  if (status === "Cancelled" && req.body.cancellationReason) {
    appointment.cancellationReason = req.body.cancellationReason;
  }

  await appointment.save();

  // Mag-notify lang kapag talagang nagbago ang status
  if (previousStatus !== status) {
    try {
      await notifyAppointmentStatus(appointment);
    } catch (err) {
      console.error("Notification error:", err.message);
    }
  }

  res.status(200).json({
    success: true,
    message: "Appointment status updated",
    data: appointment,
  });
});

// @desc    Patient reschedules their own appointment (reason required; service can change too)
// @route   PATCH /api/appointments/:id/reschedule
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointmentDate, appointmentTime, service, rescheduleReason } =
    req.body;

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

  // Puwede lang kung Pending o Confirmed pa
  if (!["Pending", "Confirmed"].includes(appointment.status)) {
    res.status(400);
    throw new Error(
      `Cannot change an appointment that is already ${appointment.status.toLowerCase()}`,
    );
  }

  // Optional: bagong service
  let newServiceId = appointment.service;
  if (service && String(service) !== String(appointment.service)) {
    const newService = await DentalService.findById(service);
    if (!newService || !newService.isActive) {
      res.status(404);
      throw new Error("Dental service not found or no longer offered");
    }
    newServiceId = newService._id;
  }

  // Block kung sarado ang clinic sa bagong petsa
  const closure = await isClosed(appointmentDate);
  if (closure.closed) {
    res.status(400);
    throw new Error(`The clinic is closed on this date (${closure.reason}).`);
  }

  // Dapat nasa oras ng clinic (9:00 AM hanggang 3:00 PM)
  if (!isValidSlot(appointmentTime)) {
    res.status(400);
    throw new Error("Please choose a time between 9:00 AM and 3:00 PM.");
  }

  // I-check ulit kung may conflict sa bagong petsa/oras
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

  // Kailangan may nabago talaga
  const unchanged =
    dateKey(appointment.appointmentDate) ===
      String(appointmentDate).slice(0, 10) &&
    appointment.appointmentTime === appointmentTime &&
    String(newServiceId) === String(appointment.service);
  if (unchanged) {
    res.status(400);
    throw new Error("Nothing was changed. Pick a new date, time or service.");
  }

  // Itabi ang dating detalye at ang reason
  const oldService = await DentalService.findById(appointment.service).select(
    "name",
  );
  appointment.rescheduleHistory.push({
    fromDate: appointment.appointmentDate,
    fromTime: appointment.appointmentTime,
    fromServiceName: oldService?.name || "",
    reason: rescheduleReason,
    changedAt: new Date(),
  });

  appointment.appointmentDate = appointmentDate;
  appointment.appointmentTime = appointmentTime;
  appointment.service = newServiceId;
  appointment.status = "Pending"; // kailangan ulit ma-confirm pagkatapos ma-reschedule

  await appointment.save();

  await notifyClinic(
    appointment._id,
    "appointment_rescheduled",
    "Appointment rescheduled",
    (who, a) =>
      `${who} moved their ${a.service?.name || "appointment"} to ${dateKey(a.appointmentDate)} at ${to12h(a.appointmentTime)}. Reason: ${rescheduleReason}`,
  );

  res.status(200).json({
    success: true,
    message: "Appointment rescheduled",
    data: appointment,
  });
});

// @desc    Patient cancels their own appointment (reason required)
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
  if (appointment.status === "Cancelled") {
    res.status(400);
    throw new Error("This appointment is already cancelled");
  }

  const reason = req.body.cancellationReason || "Cancelled by patient";
  appointment.status = "Cancelled";
  appointment.cancellationReason = reason;
  appointment.cancelledAt = new Date();
  await appointment.save();

  await notifyClinic(
    appointment._id,
    "appointment_cancelled",
    "Appointment cancelled",
    (who, a) =>
      `${who} cancelled their ${a.service?.name || "appointment"} on ${dateKey(a.appointmentDate)} at ${to12h(a.appointmentTime)}. Reason: ${reason}`,
  );

  res.status(200).json({
    success: true,
    message: "Appointment cancelled",
    data: appointment,
  });
});

module.exports = {
  createAppointment,
  getAvailableSlots,
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
};
