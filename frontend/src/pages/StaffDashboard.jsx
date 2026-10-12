import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllAppointments, updateAppointmentStatus } from "../api/adminApi";
import Navbar from "../components/Navbar";

const StaffDashboard = () => {
  const { user, logout } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await getAllAppointments();
      setAppointments(response.data);
    } catch (err) {
      setError("Failed to load appointments.");
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateAppointmentStatus(id, newStatus);
      setMessage(`Appointment marked as ${newStatus}`);
      loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <p>You can view and manage appointments below.</p>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <h2>All Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments yet.</p>
        ) : (
          <ul className="appointment-list">
            {appointments.map((appt) => (
              <li key={appt._id}>
                <span>
                  {appt.patient?.user?.name} — {appt.service?.name} with Dr.{" "}
                  {appt.dentist?.user?.name} on{" "}
                  {new Date(appt.appointmentDate).toLocaleDateString()} at{" "}
                  {appt.appointmentTime} — <strong>{appt.status}</strong>
                </span>
                {appt.status === "Pending" && (
                  <button
                    onClick={() => handleStatusUpdate(appt._id, "Confirmed")}
                  >
                    Confirm
                  </button>
                )}
                {appt.status === "Confirmed" && (
                  <button
                    onClick={() => handleStatusUpdate(appt._id, "Completed")}
                  >
                    Mark Completed
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
