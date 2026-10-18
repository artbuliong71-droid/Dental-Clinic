const path = require("path");
const { execFile } = require("child_process");
const mongoose = require("mongoose");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Dentist = require("../models/Dentist");
const Appointment = require("../models/Appointment");
const DentalService = require("../models/DentalService");
const asyncHandler = require("../utils/asyncHandler");

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

// @desc    Admin views analytics computed by the PySpark script
// @route   GET /api/admin/analytics
// @desc    Admin views analytics computed by the PySpark script
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

// @desc    Admin runs the PySpark script to recompute analytics
// @route   POST /api/admin/analytics/refresh
const refreshAnalytics = asyncHandler(async (req, res) => {
  const sparkDir = path.join(__dirname, "../../pyspark-analytics");
  const python = path.join(sparkDir, ".venv", "Scripts", "python.exe");
  const jdk = "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.101-hotspot";

  await new Promise((resolve, reject) => {
    execFile(
      python,
      ["clinic_analytics.py"],
      {
        cwd: sparkDir,
        timeout: 5 * 60 * 1000,
        env: {
          ...process.env,
          JAVA_HOME: jdk,
          PATH: `${jdk}\\bin;${process.env.PATH}`,
        },
      },
      (err, stdout, stderr) => {
        if (err) {
          console.error(stderr);
          return reject(new Error("Analytics refresh failed"));
        }
        resolve(stdout);
      },
    );
  });

  const doc = await mongoose.connection.db
    .collection("analytics_results")
    .findOne({ _id: "latest" });

  res.status(200).json({ success: true, data: doc });
});

module.exports = {
  getAllUsers,
  updateUserStatus,
  getStats,
  getAnalytics,
  refreshAnalytics,
};
