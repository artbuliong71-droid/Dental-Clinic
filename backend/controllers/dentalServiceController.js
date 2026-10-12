const DentalService = require("../models/DentalService");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get all active dental services (patients/staff see this on the booking page)
// @route   GET /api/services
const getServices = asyncHandler(async (req, res) => {
  const services = await DentalService.find({ isActive: true }).sort("name");
  res
    .status(200)
    .json({ success: true, count: services.length, data: services });
});

// @desc    Get a single service by ID
// @route   GET /api/services/:id
const getServiceById = asyncHandler(async (req, res) => {
  const service = await DentalService.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Dental service not found");
  }
  res.status(200).json({ success: true, data: service });
});

// @desc    Create a new dental service (Admin/owner only)
// @route   POST /api/services
const createService = asyncHandler(async (req, res) => {
  const { name, description, durationMinutes, price, category } = req.body;

  const service = await DentalService.create({
    name,
    description,
    durationMinutes,
    price,
    category,
  });

  res
    .status(201)
    .json({ success: true, message: "Service created", data: service });
});

// @desc    Update a dental service (Admin/owner only)
// @route   PATCH /api/services/:id
const updateService = asyncHandler(async (req, res) => {
  const service = await DentalService.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Dental service not found");
  }

  const { name, description, durationMinutes, price, category, isActive } =
    req.body;
  if (name !== undefined) service.name = name;
  if (description !== undefined) service.description = description;
  if (durationMinutes !== undefined) service.durationMinutes = durationMinutes;
  if (price !== undefined) service.price = price;
  if (category !== undefined) service.category = category;
  if (isActive !== undefined) service.isActive = isActive;

  await service.save();

  res
    .status(200)
    .json({ success: true, message: "Service updated", data: service });
});

// @desc    Delete a dental service (Admin/owner only) — soft delete
// @route   DELETE /api/services/:id
const deleteService = asyncHandler(async (req, res) => {
  const service = await DentalService.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Dental service not found");
  }

  service.isActive = false; // soft delete — keeps history intact for past appointments
  await service.save();

  res.status(200).json({ success: true, message: "Service deactivated" });
});

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
