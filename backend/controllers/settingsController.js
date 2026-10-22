const Setting = require("../models/Setting");

const getOrCreate = async () =>
  (await Setting.findOne({ key: "main" })) ||
  (await Setting.create({ key: "main" }));

// GET /api/admin/settings
const getSettings = async (req, res) => {
  try {
    const s = await getOrCreate();
    res.json({
      success: true,
      data: { sessionTimeoutMinutes: s.sessionTimeoutMinutes },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load the settings." });
  }
};

// PUT /api/admin/settings
const updateSettings = async (req, res) => {
  try {
    const minutes = Number(req.body.sessionTimeoutMinutes);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 120) {
      return res.status(400).json({
        success: false,
        message:
          "Session timeout must be a whole number from 5 to 120 minutes.",
      });
    }
    const s = await getOrCreate();
    s.sessionTimeoutMinutes = minutes;
    await s.save();
    res.json({
      success: true,
      message: "Settings saved.",
      data: { sessionTimeoutMinutes: s.sessionTimeoutMinutes },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to save the settings." });
  }
};

module.exports = { getSettings, updateSettings };
