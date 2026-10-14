import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllAppointments, updateAppointmentStatus } from "../api/adminApi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AppointmentsManager from "../components/AppointmentsManager";
import ClosedDatesView from "../components/ClosedDatesView";
import { getClosedDates } from "../api/closedDatesApi";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Hourglass,
  Check,
  ClipboardList,
} from "lucide-react";
import { todayStr } from "../utils/dateUtils";
import "../components/dashboard.css";
import "../components/manage.css";

const StaffDashboard = () => {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [closedDates, setClosedDates] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarItems = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
    {
      key: "appointments",
      label: "Appointments",
      icon: <CalendarDays size={18} />,
    },
    { key: "closures", label: "Closed Dates", icon: <CalendarX size={18} /> },
  ];

  useEffect(() => {
    loadAppointments();
    getClosedDates()
      .then((res) => setClosedDates(res.data))
      .catch(() => setClosedDates([]));
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await getAllAppointments();
      setAppointments(response.data);
    } catch (err) {
      setError("Failed to load appointments.");
    } finally {
      setDataLoading(false);
    }
  };

  const changeView = (key) => {
    setActiveView(key);
    setSidebarOpen(false);
    setError("");
    setMessage("");
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setError("");
    try {
      await updateAppointmentStatus(id, newStatus);
      setMessage(`Appointment marked as ${newStatus}`);
      await loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    }
  };

  const count = (status) =>
    appointments.filter((a) => a.status === status).length;
  const today = todayStr();
  const todays = appointments.filter(
    (a) =>
      String(a.appointmentDate).slice(0, 10) === today &&
      (a.status === "Pending" || a.status === "Confirmed"),
  );

  return (
    <div>
      <Navbar onBurgerClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="layout-container">
        <Sidebar
          items={sidebarItems}
          activeView={activeView}
          setActiveView={changeView}
          isOpen={sidebarOpen}
        />

        <div className="main-content">
          {error && (
            <p className="error-message banner" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="success-message banner" role="status">
              {message}
            </p>
          )}

          {dataLoading ? (
            <p className="muted">Loading appointments...</p>
          ) : (
            <>
              {activeView === "overview" && (
                <div>
                  <h2>Welcome back, {user?.name?.split(" ")[0]}</h2>
                  <p className="page-sub">
                    Confirm requests and keep today's schedule moving.
                  </p>

                  <div className="stat-grid">
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-number">{todays.length}</span>
                        <span className="stat-label">Today</span>
                      </div>
                      <span className="stat-icon-wrap">
                        <CalendarCheck size={22} />
                      </span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-number">{count("Pending")}</span>
                        <span className="stat-label">
                          Waiting for confirmation
                        </span>
                      </div>
                      <span className="stat-icon-wrap">
                        <Hourglass size={22} />
                      </span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-number">
                          {count("Confirmed")}
                        </span>
                        <span className="stat-label">Confirmed</span>
                      </div>
                      <span className="stat-icon-wrap">
                        <ClipboardList size={22} />
                      </span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-number">
                          {count("Completed")}
                        </span>
                        <span className="stat-label">Completed</span>
                      </div>
                      <span className="stat-icon-wrap">
                        <Check size={22} />
                      </span>
                    </div>
                  </div>

                  <h3 className="group-title">Today's appointments</h3>
                  <AppointmentsManager
                    appointments={todays}
                    onStatusUpdate={handleStatusUpdate}
                    showFilters={false}
                    emptyText="No appointments scheduled for today."
                  />
                </div>
              )}

              {activeView === "appointments" && (
                <div>
                  <h2>All Appointments</h2>
                  <AppointmentsManager
                    appointments={appointments}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              )}
              {activeView === "closures" && (
                <div>
                  <h2>Closed Dates</h2>
                  <p className="page-sub">
                    Days the clinic is closed. Sundays are always closed.
                  </p>
                  <ClosedDatesView closedDates={closedDates} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
