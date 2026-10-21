const mongoose = require("mongoose");

// Who did what, and when. The name, email and role are COPIED into each entry,
// so the history stays readable even after an account is deleted.
const personSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    email: { type: String },
    role: { type: String },
  },
  { _id: false },
);

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "login_failed",
        "otp_failed",
        "register",
        "staff_created",
        "account_deleted",
        "password_reset",
      ],
      index: true,
    },
    success: { type: Boolean, default: true },
    actor: { type: personSchema, default: {} }, // who did it
    target: { type: personSchema, default: undefined }, // who it was done to (admin creating/deleting accounts)
    ip: { type: String },
    userAgent: { type: String },
    detail: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Old entries are removed automatically (default: after 365 days)
const RETENTION_DAYS = Number(process.env.AUDIT_RETENTION_DAYS) || 365;
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
