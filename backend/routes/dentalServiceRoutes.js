const express = require("express");
const router = express.Router();

const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/dentalServiceController");
const {
  createServiceValidation,
  updateServiceValidation,
} = require("../middleware/validators/dentalServiceValidators");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public-facing (kailangan lang naka-login, kahit sinong role, makikita ang listahan ng services)
router.get("/", protect, getServices);
router.get("/:id", protect, getServiceById);

// Admin/owner only — pag-manage ng services
router.post(
  "/",
  protect,
  authorize("admin"),
  createServiceValidation,
  validate,
  createService,
);
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateServiceValidation,
  validate,
  updateService,
);
router.delete("/:id", protect, authorize("admin"), deleteService);

module.exports = router;
