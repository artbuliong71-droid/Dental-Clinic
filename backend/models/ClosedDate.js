const mongoose = require("mongoose");

const closedDateSchema = new mongoose.Schema(
  {
    // "YYYY-MM-DD" string para walang timezone problem
    date: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"],
    },
    reason: { type: String, trim: true, maxlength: 200, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ClosedDate", closedDateSchema);
