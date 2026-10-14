import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatDate } from "../utils/dateUtils";
import "./manage.css";

// appointment.patient can be a populated object or just an id
const patientIdOf = (a) =>
  a.patient && typeof a.patient === "object" ? a.patient._id : a.patient;

const PatientsView = ({ patients, appointments, onDelete }) => {
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      const id = patientIdOf(a);
      if (id) map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [appointments]);

  const q = query.trim().toLowerCase();
  const visible = patients.filter(
    (p) =>
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q),
  );

  return (
    <div>
      <div className="manage-toolbar">
        <div className="search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search patients"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">
          <p>
            {patients.length === 0
              ? "No patients yet."
              : "No patients match your search."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Appointments</th>
                <th>Joined</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p._id}>
                  <td data-label="Name">
                    <strong>{p.name}</strong>
                  </td>
                  <td data-label="Email">{p.email}</td>
                  <td data-label="Phone">{p.phone || "—"}</td>
                  <td data-label="Appointments">{counts[p.patientId] || 0}</td>
                  <td data-label="Joined">
                    {p.createdAt ? formatDate(p.createdAt) : "—"}
                  </td>
                  <td data-label="Action" className="col-action">
                    <button
                      type="button"
                      className="btn-outline-danger"
                      onClick={() => onDelete(p, counts[p.patientId] || 0)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatientsView;
