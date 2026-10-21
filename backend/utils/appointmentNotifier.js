const Notification = require("../models/Notification");
const Patient = require("../models/Patient");
const DentalService = require("../models/DentalService");
const sendEmail = require("./sendEmail");

const to12h = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

const notifyAppointmentStatus = async (appointment) => {
  const { status } = appointment;
  if (!["Confirmed", "Completed"].includes(status)) return;

  const patient = await Patient.findById(appointment.patient).populate(
    "user",
    "name email",
  );
  if (!patient?.user) return;

  const service = await DentalService.findById(appointment.service).select(
    "name",
  );
  const serviceName = service?.name || "dental";
  const when = `${fmtDate(appointment.appointmentDate)} at ${to12h(appointment.appointmentTime)}`;

  const isConfirmed = status === "Confirmed";
  const title = isConfirmed ? "Appointment confirmed" : "Appointment completed";
  const message = isConfirmed
    ? `Your ${serviceName} appointment on ${when} has been confirmed.`
    : `Your ${serviceName} visit on ${fmtDate(appointment.appointmentDate)} is marked completed. Thank you for visiting Germino-Punzal Dental!`;

  // 1) In-app notification (MongoDB)
  await Notification.create({
    user: patient.user._id,
    appointment: appointment._id,
    type: isConfirmed ? "appointment_confirmed" : "appointment_completed",
    title,
    message,
  });

  // 2) Email (best-effort — hindi dapat masira ang status update kapag pumalya)
  try {
    await sendEmail({
      to: patient.user.email,
      subject: `${title} - Germino-Punzal Dental`,
      text: `Hi ${patient.user.name},\n\n${message}`,
      html: `<p>Hi ${patient.user.name},</p><p>${message}</p>`,
    });
  } catch (err) {
    console.error("Notification email failed:", err.message);
  }
};

module.exports = { notifyAppointmentStatus };
