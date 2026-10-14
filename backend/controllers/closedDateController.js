const ClosedDate = require("../models/ClosedDate");
const Appointment = require("../models/Appointment");
const asyncHandler = require("../utils/asyncHandler");
const { isClosed } = require("../utils/clinicSchedule");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isRealDate = (s) =>
  DATE_RE.test(s) &&
  new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

// Ngayong araw sa Philippine time (UTC+8)
const todayPH = () =>
  new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

// @route GET /api/closed-dates   (lahat ng naka-login)
const getClosedDates = asyncHandler(async (req, res) => {
  const data = await ClosedDate.find().sort("date").select("date reason");
  res.json({ success: true, count: data.length, data });
});

// @route GET /api/closed-dates/check?date=2026-10-14   (lahat ng naka-login)
const checkClosedDate = asyncHandler(async (req, res) => {
  const date = String(req.query.date || "");
  if (!isRealDate(date)) {
    res.status(400);
    throw new Error("Please provide a valid date (YYYY-MM-DD).");
  }
  res.json({ success: true, data: await isClosed(date) });
});

// @route POST /api/closed-dates   (admin lang)   body: { date, reason, force }
const addClosedDate = asyncHandler(async (req, res) => {
  const date = String(req.body.date || "");
  const reason = String(req.body.reason || "")
    .trim()
    .slice(0, 200);

  if (!isRealDate(date)) {
    res.status(400);
    throw new Error("Please provide a valid date.");
  }
  if (date < todayPH()) {
    res.status(400);
    throw new Error("You can't close a date that has already passed.");
  }

  // I-warn ang admin kung may nakabook na sa araw na iyon
  if (!req.body.force) {
    const appointmentCount = await Appointment.countDocuments({
      appointmentDate: date,
      status: { $in: ["Pending", "Confirmed"] },
    });
    if (appointmentCount > 0) {
      return res.status(409).json({
        success: false,
        appointmentCount,
        message: `There ${appointmentCount === 1 ? "is 1 appointment" : `are ${appointmentCount} appointments`} already booked on this date.`,
      });
    }
  }

  try {
    const closed = await ClosedDate.create({
      date,
      reason,
      createdBy: req.user._id,
    });
    res
      .status(201)
      .json({ success: true, message: "Closed date added", data: closed });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error("That date is already marked as closed.");
    }
    throw err;
  }
});

// @route DELETE /api/closed-dates/:id   (admin lang)
const deleteClosedDate = asyncHandler(async (req, res) => {
  const closed = await ClosedDate.findByIdAndDelete(req.params.id);
  if (!closed) {
    res.status(404);
    throw new Error("Closed date not found");
  }
  res.json({ success: true, message: "Closed date removed" });
});

module.exports = {
  getClosedDates,
  checkClosedDate,
  addClosedDate,
  deleteClosedDate,
};
