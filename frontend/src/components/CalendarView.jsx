import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AppointmentsManager from "./AppointmentsManager";
import { formatDate, todayStr } from "../utils/dateUtils";
import "./manage.css";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dateKey = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Month calendar: each day shows how many appointments it has; click a day to see them. */
const CalendarView = ({ appointments, onStatusUpdate }) => {
  const today = todayStr();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);

  const byDate = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      const k = String(a.appointmentDate).slice(0, 10);
      (map[k] = map[k] || []).push(a);
    });
    return map;
  }, [appointments]);

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const offset = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const go = (delta) => setCursor(new Date(y, m + delta, 1));
  const goToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(today);
  };

  return (
    <div>
      <div className="cal-head">
        <h3 className="cal-title">
          {cursor.toLocaleDateString("en-PH", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <div className="cal-nav">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="cal-today" onClick={goToday}>
            Today
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="cal-grid">
        {DOW.map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="cal-empty" />;
          const k = dateKey(y, m, day);
          const list = (byDate[k] || []).filter(
            (a) => a.status !== "Cancelled",
          );
          const hasPending = list.some((a) => a.status === "Pending");
          return (
            <button
              key={k}
              type="button"
              className={`cal-cell ${k === today ? "is-today" : ""} ${k === selected ? "is-selected" : ""}`}
              onClick={() => setSelected(k)}
              aria-pressed={k === selected}
              aria-label={`${formatDate(k)}, ${list.length} appointment${list.length === 1 ? "" : "s"}`}
            >
              <span className="cal-day">{day}</span>
              {list.length > 0 && (
                <span
                  className={`cal-count ${hasPending ? "has-pending" : ""}`}
                >
                  {list.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="cal-legend">
        <span className="cal-count">n</span> confirmed or done
        <span className="cal-count has-pending">n</span> has a pending request
      </p>

      <h3 className="group-title">{formatDate(selected)}</h3>
      <AppointmentsManager
        appointments={byDate[selected] || []}
        onStatusUpdate={onStatusUpdate}
        showFilters={false}
        emptyText="No appointments on this day."
      />
    </div>
  );
};

export default CalendarView;
