import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AppointmentsManager from "../components/AppointmentsManager";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Stethoscope,
  Hourglass,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getStats,
  getAllAppointments,
  updateAppointmentStatus,
  getStaffList,
  createStaff,
} from "../api/adminApi";
import { getServices, createService } from "../api/servicesApi";
import { formatDate } from "../utils/dateUtils";
import "../components/dashboard.css";
import "../components/manage.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validateStaff = ({ name, email, password, phone }) => {
  const errors = {};
  if (!name.trim()) errors.name = "Full name is required.";
  if (!email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email.trim()))
    errors.email = "Enter a valid email, like name@example.com.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    errors.password = "Password must include both letters and numbers.";
  if (phone && !/^\d{11}$/.test(phone))
    errors.phone = "Phone number must be exactly 11 digits.";
  return errors;
};

const emptyService = {
  name: "",
  description: "",
  durationMinutes: "",
  price: "",
  category: "Preventive",
};
const emptyStaff = { name: "", email: "", password: "", phone: "" };

const AdminDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const [newService, setNewService] = useState(emptyService);
  const [staffForm, setStaffForm] = useState(emptyStaff);
  const [staffErrors, setStaffErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

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
    { key: "services", label: "Services", icon: <ClipboardList size={18} /> },
    { key: "staff", label: "Staff Accounts", icon: <Users size={18} /> },
  ];

  useEffect(() => {
    loadData();
    loadStaff();
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
    } finally {
      setDataLoading(false);
    }
  };

  // Separate from loadData so a missing staff endpoint doesn't break the rest
  const loadStaff = async () => {
    try {
      const res = await getStaffList();
      setStaff(res.data);
    } catch (err) {
      setStaff([]);
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
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    }
  };

  /* ---------- Services ---------- */
  const handleServiceChange = (e) =>
    setNewService({ ...newService, [e.target.name]: e.target.value });

  const handleAddService = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (Number(newService.price) <= 0)
      return setError("Price must be greater than 0.");
    if (Number(newService.durationMinutes) <= 0)
      return setError("Duration must be greater than 0.");

    setSaving(true);
    try {
      await createService(newService);
      setMessage("Service added successfully!");
      setNewService(emptyService);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add service.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Staff accounts ---------- */
  const handleStaffChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone") value = value.replace(/\D/g, "");
    setStaffForm({ ...staffForm, [name]: value });
    if (staffErrors[name]) setStaffErrors({ ...staffErrors, [name]: "" });
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const errors = validateStaff(staffForm);
    setStaffErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await createStaff({
        ...staffForm,
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
      });
      setMessage(
        "Staff account created. They can now log in with this email and password.",
      );
      setStaffForm(emptyStaff);
      loadStaff();
      loadData();
    } catch (err) {
      const list = err.response?.data?.errors;
      if (list && list.length > 0)
        setError(list.map((x) => x.message).join(", "));
      else
        setError(
          err.response?.data?.message || "Failed to create staff account.",
        );
    } finally {
      setSaving(false);
    }
  };

  const staffField = (name, label, type, placeholder, extra = {}) => (
    <div className="field">
      <label htmlFor={`staff-${name}`}>{label}</label>
      <input
        id={`staff-${name}`}
        name={name}
        type={type}
        placeholder={placeholder}
        value={staffForm[name]}
        onChange={handleStaffChange}
        className={staffErrors[name] ? "invalid" : ""}
        aria-invalid={!!staffErrors[name]}
        {...extra}
      />
      {staffErrors[name] && (
        <p className="field-error" role="alert">
          {staffErrors[name]}
        </p>
      )}
    </div>
  );

  const byStatus = stats?.appointmentsByStatus || {};
  const pending = appointments.filter((a) => a.status === "Pending");

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
            <p className="muted">Loading dashboard...</p>
          ) : (
            <>
              {/* ---------------- Overview ---------------- */}
              {activeView === "overview" && (
                <div>
                  <h2>Welcome back, {user?.name?.split(" ")[0]}</h2>
                  <p className="page-sub">
                    Here's what's happening at the clinic.
                  </p>

                  {stats && (
                    <div className="stat-grid">
                      <div className="stat-card">
                        <div className="stat-info">
                          <span className="stat-number">
                            {stats.totalPatients ?? 0}
                          </span>
                          <span className="stat-label">Patients</span>
                        </div>
                        <span className="stat-icon-wrap">
                          <Users size={22} />
                        </span>
                      </div>
                      <div className="stat-card">
                        <div className="stat-info">
                          <span className="stat-number">
                            {stats.totalDentists ?? 0}
                          </span>
                          <span className="stat-label">Dentists</span>
                        </div>
                        <span className="stat-icon-wrap">
                          <Stethoscope size={22} />
                        </span>
                      </div>
                      <div className="stat-card">
                        <div className="stat-info">
                          <span className="stat-number">
                            {stats.totalServices ?? 0}
                          </span>
                          <span className="stat-label">Services</span>
                        </div>
                        <span className="stat-icon-wrap">
                          <ClipboardList size={22} />
                        </span>
                      </div>
                      <div className="stat-card">
                        <div className="stat-info">
                          <span className="stat-number">
                            {stats.totalAppointments ?? 0}
                          </span>
                          <span className="stat-label">Appointments</span>
                        </div>
                        <span className="stat-icon-wrap">
                          <CalendarDays size={22} />
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="status-row">
                    {["Pending", "Confirmed", "Completed", "Cancelled"].map(
                      (s) => (
                        <div className="status-tile" key={s}>
                          <span
                            className={`status-badge status-${s.toLowerCase()}`}
                          >
                            {s}
                          </span>
                          <strong>{byStatus[s] ?? 0}</strong>
                        </div>
                      ),
                    )}
                  </div>

                  <h3 className="group-title">
                    <Hourglass size={16} /> Waiting for confirmation
                  </h3>
                  <AppointmentsManager
                    appointments={pending}
                    onStatusUpdate={handleStatusUpdate}
                    showFilters={false}
                    emptyText="All caught up. No pending appointments."
                  />
                </div>
              )}

              {/* ---------------- Appointments ---------------- */}
              {activeView === "appointments" && (
                <div>
                  <h2>All Appointments</h2>
                  <AppointmentsManager
                    appointments={appointments}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              )}

              {/* ---------------- Services ---------------- */}
              {activeView === "services" && (
                <div>
                  <h2>Manage Services</h2>
                  <p className="page-sub">
                    Services you add here appear in the patient booking page.
                  </p>

                  <form onSubmit={handleAddService} className="form-section">
                    <h3>Add a service</h3>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="svc-name">Service name</label>
                        <input
                          id="svc-name"
                          type="text"
                          name="name"
                          placeholder="e.g. Prophylaxis"
                          value={newService.name}
                          onChange={handleServiceChange}
                          required
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="svc-category">Category</label>
                        <select
                          id="svc-category"
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
                      <div className="field">
                        <label htmlFor="svc-duration">Duration (minutes)</label>
                        <input
                          id="svc-duration"
                          type="number"
                          min="1"
                          name="durationMinutes"
                          value={newService.durationMinutes}
                          onChange={handleServiceChange}
                          required
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="svc-price">Price (₱)</label>
                        <input
                          id="svc-price"
                          type="number"
                          min="1"
                          name="price"
                          value={newService.price}
                          onChange={handleServiceChange}
                          required
                        />
                      </div>
                      <div className="field field-wide">
                        <label htmlFor="svc-desc">Description (optional)</label>
                        <input
                          id="svc-desc"
                          type="text"
                          name="description"
                          placeholder="Short description for patients"
                          value={newService.description}
                          onChange={handleServiceChange}
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn-primary-sm"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Add service"}
                      </button>
                    </div>
                  </form>

                  <h3 className="group-title">
                    Current services ({services.length})
                  </h3>
                  {services.length === 0 ? (
                    <div className="empty-state">
                      <p>No services yet. Add your first one above.</p>
                    </div>
                  ) : (
                    <div className="service-list">
                      {services.map((s) => (
                        <div className="service-item" key={s._id}>
                          <div className="service-item-head">
                            <h4>{s.name}</h4>
                            {s.category && (
                              <span className="pill">{s.category}</span>
                            )}
                          </div>
                          <p>{s.description}</p>
                          <div className="service-item-foot">
                            <span>₱{Number(s.price).toLocaleString()}</span>
                            <span>{s.durationMinutes} mins</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- Staff accounts ---------------- */}
              {activeView === "staff" && (
                <div>
                  <h2>Staff Accounts</h2>
                  <p className="page-sub">
                    Create accounts for clinic staff. They log in with the email
                    and password you set here.
                  </p>

                  <form
                    onSubmit={handleAddStaff}
                    className="form-section"
                    noValidate
                  >
                    <h3>Create a staff account</h3>
                    <p className="form-hint">
                      The login code (OTP) is sent to the staff member's email,
                      so use a real address.
                    </p>
                    <div className="form-grid">
                      {staffField(
                        "name",
                        "Full name",
                        "text",
                        "Enter full name",
                      )}
                      {staffField(
                        "email",
                        "Email",
                        "email",
                        "name@example.com",
                      )}
                      <div className="field">
                        <label htmlFor="staff-password">
                          Temporary password
                        </label>
                        <div className="pw-wrap">
                          <input
                            id="staff-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="At least 8 characters, letters and numbers"
                            value={staffForm.password}
                            onChange={handleStaffChange}
                            className={staffErrors.password ? "invalid" : ""}
                            aria-invalid={!!staffErrors.password}
                          />
                          <button
                            type="button"
                            className="pw-toggle"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                        {staffErrors.password && (
                          <p className="field-error" role="alert">
                            {staffErrors.password}
                          </p>
                        )}
                      </div>
                      {staffField(
                        "phone",
                        "Phone number (optional)",
                        "tel",
                        "11-digit phone number",
                        { inputMode: "numeric" },
                      )}
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn-primary-sm"
                        disabled={saving}
                      >
                        {saving ? "Creating..." : "Create staff account"}
                      </button>
                    </div>
                  </form>

                  <h3 className="group-title">
                    Current staff ({staff.length})
                  </h3>
                  {staff.length === 0 ? (
                    <div className="empty-state">
                      <p>No staff accounts yet.</p>
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Added</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staff.map((s) => (
                            <tr key={s._id}>
                              <td data-label="Name">
                                <strong>{s.name}</strong>
                              </td>
                              <td data-label="Email">{s.email}</td>
                              <td data-label="Phone">{s.phone || "—"}</td>
                              <td data-label="Status">
                                <span
                                  className={`status-badge ${s.isActive === false ? "status-cancelled" : "status-completed"}`}
                                >
                                  {s.isActive === false ? "Inactive" : "Active"}
                                </span>
                              </td>
                              <td data-label="Added">
                                {s.createdAt ? formatDate(s.createdAt) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
