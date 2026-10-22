const mongoose = require("mongoose");

// Iisang dokumento lang ito (key: "main") para sa mga setting ng clinic
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    sessionTimeoutMinutes: { type: Number, default: 30, min: 5, max: 120 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Setting", settingSchema);
