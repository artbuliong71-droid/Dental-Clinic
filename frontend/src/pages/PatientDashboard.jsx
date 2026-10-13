import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  FileText,
  Hourglass,
} from "lucide-react";
import { getServices } from "../api/servicesApi";
import { getDentists } from "../api/dentistsApi";
import {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
} from "../api/appointmentsApi";

const PatientDashboard = () => {
  const { user, logout } = useAuth();

  const [services, setServices] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [formData, setFormData] = useState({
    dentist: "",
    service: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarItems = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
    {
      key: "book",
      label: "Book Appointment",
      icon: <CalendarPlus size={18} />,
    },
    {
      key: "appointments",
      label: "My Appointments",
      icon: <CalendarDays size={18} />,
    },
  ];

  // Kinukuha natin ang lahat ng kailangang data pagka-load ng page
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesRes, dentistsRes, appointmentsRes] = await Promise.all([
        getServices(),
        getDentists(),
        getMyAppointments(),
      ]);
      setServices(servicesRes.data);
      setDentists(dentistsRes.data);
      setAppointments(appointmentsRes.data);
    } catch (err) {
      setError("Failed to load data. Please refresh the page.");
    }
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await bookAppointment(formData);
      setMessage("Appointment booked successfully!");
      setFormData({
        dentist: "",
        service: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
      });
      loadData(); // i-refresh ang listahan ng appointments
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?"))
      return;

    try {
      await cancelAppointment(id);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment.");
    }
  };

  return (
    <div>
      <Navbar onBurgerClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="layout-container">
        <Sidebar
          items={sidebarItems}
          activeView={activeView}
          setActiveView={(key) => {
            setActiveView(key);
            setSidebarOpen(false); // isara ang sidebar pagkatapos pumili (mahalaga sa mobile)
          }}
          isOpen={sidebarOpen}
        />

        <div className="main-content">
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          {activeView === "overview" && (
            <div>
              <h2>Overview</h2>
              <p>Welcome back, {user?.name}!</p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div className="stat-card">
                  <span className="stat-icon">📋</span>
                  <div className="stat-info">
                    <span className="stat-number">{appointments.length}</span>
                    <span className="stat-label">Total Appointments</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">⏳</span>
                  <div className="stat-info">
                    <span className="stat-number">
                      {
                        appointments.filter(
                          (a) =>
                            a.status === "Pending" || a.status === "Confirmed",
                        ).length
                      }
                    </span>
                    <span className="stat-label">Upcoming</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "book" && (
            <div>
              <h2>Book an Appointment</h2>
              <form onSubmit={handleBookAppointment} className="booking-form">
                <div>
                  <label>Dentist</label>
                  <select
                    name="dentist"
                    value={formData.dentist}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Dentist --</option>
                    {dentists.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.user?.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Service</label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Service --</option>
                    {services.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} - ₱{s.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Date</label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label>Time</label>
                  <input
                    type="time"
                    name="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label>Reason (optional)</label>
                  <input
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? "Booking..." : "Book Appointment"}
                </button>
              </form>
            </div>
          )}

          {activeView === "appointments" && (
            <div>
              <h2>My Appointments</h2>
              {appointments.length === 0 ? (
                <p>No appointments yet.</p>
              ) : (
                <ul className="appointment-list">
                  {appointments.map((appt) => (
                    <li key={appt._id}>
                      <span>
                        {appt.service?.name} with Dr. {appt.dentist?.user?.name}{" "}
                        on {new Date(appt.appointmentDate).toLocaleDateString()}{" "}
                        at {appt.appointmentTime} —{" "}
                        <span
                          className={`status-badge status-${appt.status.toLowerCase()}`}
                        >
                          {appt.status}
                        </span>
                      </span>
                      {appt.status !== "Completed" &&
                        appt.status !== "Cancelled" && (
                          <button onClick={() => handleCancel(appt._id)}>
                            Cancel
                          </button>
                        )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
