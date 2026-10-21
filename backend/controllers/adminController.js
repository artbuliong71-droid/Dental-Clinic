const mongoose = require("mongoose");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Dentist = require("../models/Dentist");
const Appointment = require("../models/Appointment");
const DentalService = require("../models/DentalService");
const asyncHandler = require("../utils/asyncHandler");
const { runNow, isRunning } = require("../utils/analyticsService");

// @desc    Admin views all user accounts (optional ?role= filter)
// @route   GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;

  const users = await User.find(filter).sort("-createdAt");

  res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc    Admin activates/deactivates a user account
// @route   PATCH /api/admin/users/:id/status
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Hindi puwedeng i-deactivate ng admin ang sarili niyang account (safety check)
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot deactivate your own account");
  }

  user.isActive = isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${isActive ? "activated" : "deactivated"}`,
    data: user,
  });
});

// @desc    Admin views overall system statistics
// @route   GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [
    totalPatients,
    totalDentists,
    totalServices,
    totalAppointments,
    pendingCount,
    confirmedCount,
    completedCount,
    cancelledCount,
  ] = await Promise.all([
    Patient.countDocuments(),
    Dentist.countDocuments(),
    DentalService.countDocuments({ isActive: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: "Pending" }),
    Appointment.countDocuments({ status: "Confirmed" }),
    Appointment.countDocuments({ status: "Completed" }),
    Appointment.countDocuments({ status: "Cancelled" }),
  ]);

  // Pinaka-madalas na hiniling na service (top 5)
  const topServices = await Appointment.aggregate([
    { $group: { _id: "$service", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "dentalservices",
        localField: "_id",
        foreignField: "_id",
        as: "serviceInfo",
      },
    },
    { $unwind: "$serviceInfo" },
    { $project: { _id: 0, serviceName: "$serviceInfo.name", count: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalPatients,
      totalDentists,
      totalServices,
      totalAppointments,
      appointmentsByStatus: {
        Pending: pendingCount,
        Confirmed: confirmedCount,
        Completed: completedCount,
        Cancelled: cancelledCount,
      },
      topServices,
    },
  });
});

// @desc    Admin views analytics computed by the PySpark service
// @route   GET /api/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  // Raw collection ang gamit dahil string ("latest") ang _id, hindi ObjectId
  const doc = await mongoose.connection.db
    .collection("analytics_results")
    .findOne({ _id: "latest" });

  if (!doc) {
    res.status(404);
    throw new Error("No analytics found yet. Click Refresh to generate them.");
  }

  res.status(200).json({ success: true, data: doc });
});

// @desc    Recompute analytics now (the Spark service is already running)
// @route   POST /api/admin/analytics/refresh
const refreshAnalytics = asyncHandler(async (req, res) => {
  const alreadyRunning = isRunning();
  runNow(); // hindi hinihintay

  const doc = await mongoose.connection.db
    .collection("analytics_results")
    .findOne({ _id: "latest" });

  res
    .status(202)
    .json({ success: true, running: true, alreadyRunning, data: doc });
});

// @desc    Is the analytics job running right now?
// @route   GET /api/admin/analytics/status
const getAnalyticsStatus = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, running: isRunning() });
});

module.exports = {
  getAllUsers,
  updateUserStatus,
  getStats,
  getAnalytics,
  refreshAnalytics,
  getAnalyticsStatus,
};
