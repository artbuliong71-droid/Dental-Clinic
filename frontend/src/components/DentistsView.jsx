import { dentistLabel } from "../utils/dateUtils";
import "./manage.css";

const DentistsView = ({ dentists }) => {
  if (dentists.length === 0) {
    return (
      <div className="empty-state">
        <p>No dentists found.</p>
      </div>
    );
  }
  return (
    <div className="service-list">
      {dentists.map((d) => (
        <div className="service-item" key={d._id}>
          <div className="service-item-head">
            <h4>{dentistLabel(d.user?.name)}</h4>
            {d.specialization && (
              <span className="pill">{d.specialization}</span>
            )}
          </div>
          <p>{d.user?.email}</p>
          <div className="service-item-foot">
            <span>License</span>
            <span>{d.licenseNumber || "—"}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DentistsView;
