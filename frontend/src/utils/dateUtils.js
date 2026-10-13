// Shared date/time helpers (src/utils/dateUtils.js)

// Read the saved date as a plain calendar date (avoids timezone shifts)
export const parseDate = (value) =>
  new Date(`${String(value).slice(0, 10)}T00:00:00`);

export const formatDate = (value) =>
  parseDate(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const formatTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export const apptWhen = (a) =>
  new Date(
    `${String(a.appointmentDate).slice(0, 10)}T${a.appointmentTime || "00:00"}`,
  );

// Local YYYY-MM-DD
export const todayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export const isActiveStatus = (status) =>
  status === "Pending" || status === "Confirmed";
