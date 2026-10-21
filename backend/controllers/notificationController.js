const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

// @route GET /api/notifications
const getMyNotifications = asyncHandler(async (req, res) => {
  const [data, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort("-createdAt").limit(30),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, unreadCount, data });
});

// @route PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true },
  );
  if (!notif) {
    res.status(404);
    throw new Error("Notification not found");
  }
  res.json({ success: true, data: notif });
});

// @route PATCH /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true },
  );
  res.json({ success: true, message: "All notifications marked as read" });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
