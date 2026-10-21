const AuditLog = require("../models/AuditLog");
const User = require("../models/User");

const str = (v, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
const clientIp = (req) => {
  const ip = String(
    req.ip || (req.socket && req.socket.remoteAddress) || "",
  ).replace("::ffff:", "");
  return ip === "::1" ? "localhost" : ip;
};
const person = (u) =>
  u
    ? { userId: u._id || u.id, name: u.name, email: u.email, role: u.role }
    : {};

const findByEmail = async (email) => {
  if (typeof email !== "string") return null;
  try {
    return await User.findOne({ email: email.trim().toLowerCase() }).select(
      "name email role",
    );
  } catch (err) {
    return null;
  }
};

// Saving a log must NEVER break the request, so errors are only printed.
const record = async (entry) => {
  try {
    await AuditLog.create(entry);
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

/**
 * Put this in a route to log what happens when it finishes:
 *   "login"           wrong email/password (401)
 *   "verify-otp"      successful login (200) or wrong code (401/429)
 *   "register"        new patient account (201)
 *   "password-reset"  password changed with the Forgot Password code (200)
 *   "staff-created"   admin created a staff account (201)
 *   "account-deleted" admin deleted a staff/patient account (200)
 * Passwords and codes are never saved.
 */
const auditEvent = (kind) => async (req, res, next) => {
  // Remember the response body so we know the user's id/name/role after a successful login
  let body;
  const send = res.json.bind(res);
  res.json = (payload) => {
    body = payload;
    return send(payload);
  };

  // For deletes, look up the account BEFORE it disappears
  let target = null;
  if (kind === "account-deleted") {
    try {
      target = await User.findById(req.params.id).select("name email role");
    } catch (err) {
      /* invalid id: the controller will answer with an error */
    }
  }

  res.on("finish", async () => {
    try {
      const status = res.statusCode;
      const message =
        body && typeof body.message === "string" ? body.message : "";
      const base = {
        ip: clientIp(req),
        userAgent: str(req.headers && req.headers["user-agent"]),
      };
      const typedEmail = str(req.body && req.body.email, 100);

      if (kind === "login" && status === 401) {
        const u = await findByEmail(typedEmail);
        await record({
          ...base,
          action: "login_failed",
          success: false,
          actor: u ? person(u) : { email: typedEmail },
          detail: message,
        });
      } else if (kind === "verify-otp") {
        if (status === 200 && body && body.data && body.data.user) {
          await record({
            ...base,
            action: "login",
            actor: person(body.data.user),
          });
        } else if (status === 401 || status === 429) {
          const u = await findByEmail(typedEmail);
          await record({
            ...base,
            action: "otp_failed",
            success: false,
            actor: u ? person(u) : { email: typedEmail },
            detail: message,
          });
        }
      } else if (
        kind === "register" &&
        status === 201 &&
        body &&
        body.data &&
        body.data.user
      ) {
        await record({
          ...base,
          action: "register",
          actor: person(body.data.user),
          detail: "New patient account",
        });
      } else if (kind === "password-reset" && status === 200) {
        const u = await findByEmail(typedEmail);
        await record({
          ...base,
          action: "password_reset",
          actor: u ? person(u) : { email: typedEmail },
          detail: "Password changed with the Forgot Password code",
        });
      } else if (kind === "staff-created" && status === 201) {
        const created = (body && body.data) || {};
        await record({
          ...base,
          action: "staff_created",
          actor: person(req.user),
          target: { name: created.name, email: created.email, role: "staff" },
        });
      } else if (kind === "account-deleted" && status === 200 && target) {
        await record({
          ...base,
          action: "account_deleted",
          actor: person(req.user),
          target: person(target),
        });
      }
    } catch (err) {
      console.error("Audit log failed:", err.message);
    }
  });

  next();
};

module.exports = { auditEvent };
