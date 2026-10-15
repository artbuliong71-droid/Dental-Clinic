require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Dental Clinic API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/services", require("./routes/dentalServiceRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/dentists", require("./routes/dentistRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/closed-dates", require("./routes/closedDateRoutes"));
app.use("/api/records", require("./routes/recordsRoutes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});

module.exports = app;
