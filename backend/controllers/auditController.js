const AuditLog = require("../models/AuditLog");

const ACTIONS = [
  "login",
  "login_failed",
  "otp_failed",
  "register",
  "staff_created",
  "account_deleted",
  "password_reset",
  "patient_registered",
];
const ROLES = ["patient", "staff", "admin"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/admin/audit-logs?page=1&limit=20&action=login&role=patient&from=2026-10-01&to=2026-10-20&q=art
const getAuditLogs = async (req, res) => {
  try {
    const { action, role, from, to, q } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      50,
    );

    const filter = {};
    if (ACTIONS.includes(action)) filter.action = action;
    if (ROLES.includes(role)) filter["actor.role"] = role;

    // Day boundaries in the server's local time
    const range = {};
    if (typeof from === "string" && DATE.test(from))
      range.$gte = new Date(`${from}T00:00:00`);
    if (typeof to === "string" && DATE.test(to))
      range.$lte = new Date(`${to}T23:59:59.999`);
    if (Object.keys(range).length) filter.createdAt = range;

    if (typeof q === "string" && q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim().slice(0, 60)), "i");
      filter.$or = [
        { "actor.name": rx },
        { "actor.email": rx },
        { "target.name": rx },
        { "target.email": rx },
      ];
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      success: true,
      data: { logs, page, pages: Math.max(Math.ceil(total / limit), 1), total },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load the audit logs." });
  }
};

module.exports = { getAuditLogs };
