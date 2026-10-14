const ClosedDate = require("../models/ClosedDate");

const CLOSED_WEEKDAYS = [0]; // 0 = Sunday

// Tumatanggap ng "YYYY-MM-DD" (o ISO string, kukunin lang ang unang 10 chars)
const isClosed = async (dateInput) => {
  const dateStr = String(dateInput).slice(0, 10);
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

  if (CLOSED_WEEKDAYS.includes(weekday)) {
    return { closed: true, reason: "Closed on Sundays" };
  }

  const found = await ClosedDate.findOne({ date: dateStr });
  return found
    ? { closed: true, reason: found.reason || "Clinic closed" }
    : { closed: false };
};

module.exports = { isClosed, CLOSED_WEEKDAYS };
