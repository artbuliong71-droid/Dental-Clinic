import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  getStats,
  getAllAppointments,
  updateAppointmentStatus,
} from "../api/adminApi";
import { getServices, createService } from "../api/servicesApi";

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    durationMinutes: "",
    price: "",
    category: "Preventive",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, appointmentsRes, servicesRes] = await Promise.all([
        getStats(),
        getAllAppointments(),
        getServices(),
      ]);
      setStats(statsRes.data);
      setAppointments(appointmentsRes.data);
      setServices(servicesRes.data);
    } catch (err) {
      setError("Failed to load dashboard data.");
    }
  };
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateAppointmentStatus(id, newStatus);
      setMessage(`Appointment marked as ${newStatus}`);
      loadData(); // i-refresh ang listahan
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    }
  };

  const handleServiceChange = (e) => {
    setNewService({ ...newService, [e.target.name]: e.target.value });
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await createService(newService);
      setMessage("Service added successfully!");
      setNewService({
        name: "",
        description: "",
        durationMinutes: "",
        price: "",
        category: "Preventive",
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add service.");
    }
  };
  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <h2>System Statistics</h2>
        {stats && (
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div className="stat-card">
              Total Patients: {stats.totalPatients}
            </div>
            <div className="stat-card">
              Total Dentists: {stats.totalDentists}
            </div>
            <div className="stat-card">
              Total Services: {stats.totalServices}
            </div>
            <div className="stat-card">
              Total Appointments: {stats.totalAppointments}
            </div>
            <div className="stat-card">
              Pending: {stats.appointmentsByStatus.Pending}
            </div>
            <div className="stat-card">
              Confirmed: {stats.appointmentsByStatus.Confirmed}
            </div>
            <div className="stat-card">
              Completed: {stats.appointmentsByStatus.Completed}
            </div>
            <div className="stat-card">
              Cancelled: {stats.appointmentsByStatus.Cancelled}
            </div>
          </div>
        )}

        <h2>Manage Services</h2>
        <form onSubmit={handleAddService} className="booking-form">
          <div>
            <label>Service Name</label>
            <input
              type="text"
              name="name"
              value={newService.name}
              onChange={handleServiceChange}
              required
            />
          </div>
          <div>
            <label>Description</label>
            <input
              type="text"
              name="description"
              value={newService.description}
              onChange={handleServiceChange}
            />
          </div>
          <div>
            <label>Duration (min)</label>
            <input
              type="number"
              name="durationMinutes"
              value={newService.durationMinutes}
              onChange={handleServiceChange}
              required
            />
          </div>
          <div>
            <label>Price</label>
            <input
              type="number"
              name="price"
              value={newService.price}
              onChange={handleServiceChange}
              required
            />
          </div>
          <div>
            <label>Category</label>
            <select
              name="category"
              value={newService.category}
              onChange={handleServiceChange}
            >
              <option value="Preventive">Preventive</option>
              <option value="Restorative">Restorative</option>
              <option value="Surgical">Surgical</option>
              <option value="Cosmetic">Cosmetic</option>
              <option value="Diagnostic">Diagnostic</option>
            </select>
          </div>
          <button type="submit">Add Service</button>
        </form>

        <ul className="appointment-list">
          {services.map((s) => (
            <li key={s._id}>
              <span>
                {s.name} — ₱{s.price} ({s.durationMinutes} mins)
              </span>
            </li>
          ))}
        </ul>

        <h2>All Appointments</h2>
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
      </div>
    </div>
  );
};

export default AdminDashboard;
