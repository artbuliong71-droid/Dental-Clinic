const ClosedDate = require("../models/ClosedDate");

const CLOSED_WEEKDAYS = [0];

// Tumatanggap ng "YYYY-MM-DD" (o ISO string, kukunin lang ang unang 10 chars)
const isClosed = async (dateInput) => {
  const dateStr = String(dateInput).slice(0, 10);
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

  const isValidSlot = (time) => getAllSlots().includes(String(time));

  if (CLOSED_WEEKDAYS.includes(weekday)) {
    return { closed: true, reason: "Closed on Sundays" };
  }

  const found = await ClosedDate.findOne({ date: dateStr });
  return found
    ? { closed: true, reason: found.reason || "Clinic closed" }
    : { closed: false };
};
const OPEN_HOUR = 9;
const CLOSE_HOUR = 15; // 3:00 PM
const SLOT_MINUTES = 60;

// ["09:00", "10:00", ... "14:00"]
const getAllSlots = () => {
  const slots = [];
  for (
    let m = OPEN_HOUR * 60;
    m + SLOT_MINUTES <= CLOSE_HOUR * 60;
    m += SLOT_MINUTES
  ) {
    const h = String(Math.floor(m / 60)).padStart(2, "0");
    const min = String(m % 60).padStart(2, "0");
    slots.push(`${h}:${min}`);
  }
  return slots;
};

const isValidSlot = (time) => getAllSlots().includes(String(time));

module.exports = { isClosed, CLOSED_WEEKDAYS, getAllSlots, isValidSlot };
