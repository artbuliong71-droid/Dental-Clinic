export const CLOSED_WEEKDAYS = [0];
// Ibabalik ang { reason } kung sarado, o null kung bukas
export const closedInfo = (dateStr, closedDates = []) => {
  const s = String(dateStr).slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  if (CLOSED_WEEKDAYS.includes(new Date(Date.UTC(y, m - 1, d)).getUTCDay())) {
    return { reason: "Closed on Sundays" };
  }
  const found = closedDates.find((c) => c.date === s);
  return found ? { reason: found.reason || "Clinic closed" } : null;
};
