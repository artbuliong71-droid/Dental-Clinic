const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  updateUserStatus,
  getStats,
} = require("../controllers/adminController");
const { getStaff, createStaff } = require("../controllers/staffController");
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

// Staff accounts (admin creates them; no more hardcoded staff)
router.get("/staff", protect, authorize("admin"), getStaff);
router.post("/staff", protect, authorize("admin"), createStaff);

module.exports = router;
