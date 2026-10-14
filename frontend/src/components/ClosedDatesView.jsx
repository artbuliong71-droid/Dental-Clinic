import { formatDate, todayStr } from "../utils/dateUtils";
import "./manage.css";

/** Listahan ng mga susunod na sarado. May Delete button lang kung may onDelete (admin). */
const ClosedDatesView = ({ closedDates, onDelete }) => {
  const upcoming = closedDates.filter((c) => c.date >= todayStr());

  return (
    <>
      <h3 className="group-title">Upcoming closures ({upcoming.length})</h3>
      <p className="form-hint">All Sundays are closed automatically.</p>
      {upcoming.length === 0 ? (
        <div className="empty-state">
          <p>No special closures scheduled.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reason</th>
                {onDelete && <th className="col-action">Action</th>}
              </tr>
            </thead>
            <tbody>
              {upcoming.map((c) => (
                <tr key={c._id}>
                  <td data-label="Date">
                    <strong>{formatDate(c.date)}</strong>
                  </td>
                  <td data-label="Reason">{c.reason || "—"}</td>
                  {onDelete && (
                    <td data-label="Action" className="col-action">
                      <button
                        type="button"
                        className="btn-outline-danger"
                        onClick={() => onDelete(c)}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default ClosedDatesView;
