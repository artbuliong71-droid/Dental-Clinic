const express = require("express");
const router = express.Router();
const { getAuditLogs } = require("../controllers/auditController");
const { auditEvent } = require("../utils/AuditLog");
const {
  getAllUsers,
  updateUserStatus,
  getStats,
  getAnalytics,
  refreshAnalytics,
  getAnalyticsStatus,
} = require("../controllers/adminController");
const { getStaff, createStaff } = require("../controllers/staffController");
const {
  getPatients,
  deleteAccount,
} = require("../controllers/accountsController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Lahat ng routes dito ay Admin-only (may-ari lang, hindi staff)
router.get("/users", protect, authorize("admin"), getAllUsers);
router.patch(
  "/users/:id/status",
  protect,
  authorize("admin"),
  updateUserStatus,
);
router.get("/stats", protect, authorize("admin"), getStats);
router.get("/analytics", protect, authorize("admin"), getAnalytics);
router.post(
  "/analytics/refresh",
  protect,
  authorize("admin"),
  refreshAnalytics,
);
router.get(
  "/analytics/status",
  protect,
  authorize("admin"),
  getAnalyticsStatus,
);

// Staff accounts (admin creates them; no more hardcoded staff)
router.get("/staff", protect, authorize("admin"), getStaff);
router.post(
  "/staff",
  protect,
  authorize("admin"),
  auditEvent("staff-created"),
  createStaff,
);
// Patients list + delete a staff or patient account
router.get("/patients", protect, authorize("admin"), getPatients);
router.delete(
  "/accounts/:id",
  protect,
  authorize("admin"),
  auditEvent("account-deleted"),
  deleteAccount,
);
router.get("/audit-logs", protect, authorize("admin"), getAuditLogs);

module.exports = router;
