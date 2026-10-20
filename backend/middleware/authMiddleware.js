const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token is invalid or expired");
  }

  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("Not authorized, user no longer exists or is inactive");
  }
  if (
    user.passwordChangedAt &&
    decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
  ) {
    res.status(401);
    throw new Error("Password was changed. Please log in again.");
  }
  req.user = user;
  next();
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user ? req.user.role : "unknown"}' is not authorized to access this route`,
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
