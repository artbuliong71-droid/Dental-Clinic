const path = require("path");
const { execFile } = require("child_process");
const mongoose = require("mongoose");

// DentalClinic-app/pyspark-analytics (this file is in DentalClinic-app/backend/controllers)
const SCRIPT_DIR = path.join(__dirname, "..", "..", "pyspark-analytics");
const SCRIPT = "clinic_analytics.py";
const PYTHON = process.env.PYTHON_PATH || "python"; // on Mac/Linux you may need PYTHON_PATH=python3

const latest = () =>
  mongoose.connection
    .collection("analytics_results")
    .findOne({ _id: "latest" });

let running = false; // only one analytics job at a time

// GET /api/admin/analytics — the saved results (data is null if the job never ran)
const getAnalytics = async (req, res) => {
  try {
    res.json({ success: true, data: await latest() });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load the analytics." });
  }
};

// POST /api/admin/analytics/refresh — runs the PySpark job, then returns the new results
const refreshAnalytics = async (req, res) => {
  if (running) {
    return res
      .status(409)
      .json({
        success: false,
        message: "Analytics is already being updated. Please wait.",
      });
  }

  running = true;
  try {
    // Fixed command, no user input is ever passed to it
    await new Promise((resolve, reject) => {
      execFile(
        PYTHON,
        [SCRIPT],
        {
          cwd: SCRIPT_DIR,
          timeout: 180000,
          windowsHide: true,
          maxBuffer: 5 * 1024 * 1024,
        },
        (error, stdout, stderr) => {
          if (error) {
            error.stderr = stderr;
            return reject(error);
          }
          resolve(stdout);
        },
      );
    });

    res.json({
      success: true,
      message: "Analytics updated.",
      data: await latest(),
    });
  } catch (error) {
    const stderr = String(error.stderr || "");
    console.error("Analytics job failed:", stderr || error.message);

    let message =
      "Failed to run the analytics job. Check the backend terminal for details.";
    if (error.code === "ENOENT") {
      message =
        "Python was not found. Install Python, or set PYTHON_PATH in backend/.env.";
    } else if (error.killed) {
      message = "The analytics job took too long and was stopped.";
    } else if (/No module named/i.test(stderr)) {
      message =
        "A Python package is missing. In the pyspark-analytics folder run: pip install -r clinic_requirements.txt";
    } else if (
      /JAVA_HOME is not set|Java gateway|java: command not found|'java' is not recognized/i.test(
        stderr,
      )
    ) {
      message = "Java was not found. PySpark needs Java 17 or newer installed.";
    } else if (/ServerSelectionTimeoutError|Connection refused/i.test(stderr)) {
      message = "The analytics job could not connect to MongoDB.";
    }
    res.status(500).json({ success: false, message });
  } finally {
    running = false;
  }
};

module.exports = { getAnalytics, refreshAnalytics };
