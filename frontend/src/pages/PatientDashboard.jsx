import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  ClipboardList,
  Hourglass,
  Check,
  Clock,
  Sparkles,
  Wrench,
  Syringe,
  Stethoscope,
  Settings,
  Smile,
  User,
  FileText,
} from "lucide-react";
import { getServices } from "../api/servicesApi";
import { getDentists } from "../api/dentistsApi";
import {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getAvailableSlots,
} from "../api/appointmentsApi";
import { getClosedDates } from "../api/closedDatesApi";
import { closedInfo } from "../utils/closedDays";
import { dentistLabel, greetingName } from "../utils/dateUtils";
import { getMyRecords, updateMyProfile } from "../api/recordsApi";
import MedicalProfileForm from "../components/MedicalProfileForm";
import MyRecords from "../components/MyRecords";
import "../components/dashboard.css";

/* ---------- Helpers ---------- */

// Icon + short description per dental service (matched by name)
const SERVICE_META = [
  {
    match: "prophylaxis",
    icon: Sparkles,
    desc: "Professional cleaning to remove plaque and tartar.",
  },
  {
    match: "filling",
    icon: Wrench,
    desc: "Repairs a tooth damaged by a cavity.",
  },
  {
    match: "extraction",
    icon: Syringe,
    desc: "Safe removal of a damaged or problem tooth.",
  },
  {
    match: "check",
    icon: Stethoscope,
    desc: "Routine exam of your teeth and gums.",
  },
  {
    match: "braces",
    icon: Settings,
    desc: "Adjustment and tightening for your braces.",
  },
];
const getMeta = (name = "") =>
  SERVICE_META.find((m) => name.toLowerCase().includes(m.match)) || {
    icon: Smile,
    desc: "",
  };

const peso = (n) => `₱${Number(n).toLocaleString()}`;

// Local YYYY-MM-DD (used for the date input's min value)
const todayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const nowTimeStr = () => new Date().toTimeString().slice(0, 5);

// Read the saved date as a plain calendar date (avoids timezone shifts)
const parseDate = (value) => new Date(`${String(value).slice(0, 10)}T00:00:00`);
const formatDate = (value) =>
  parseDate(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const formatTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
const apptWhen = (a) =>
  new Date(
    `${String(a.appointmentDate).slice(0, 10)}T${a.appointmentTime || "00:00"}`,
  );

const emptyForm = {
  dentist: "",
  service: "",
  appointmentDate: "",
  appointmentTime: "",
  reason: "",
};

/* ---------- Component ---------- */

const PatientDashboard = () => {
  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [closedDates, setClosedDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [profile, setProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
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
    { key: "records", label: "My Records", icon: <FileText size={18} /> },
    { key: "profile", label: "My Profile", icon: <User size={18} /> },
  ];

  useEffect(() => {
    loadData();
    loadRecords();
    getClosedDates()
      .then((res) => setClosedDates(res.data))
      .catch(() => setClosedDates([]));
  }, []);

  // Kunin ang bakanteng oras tuwing magbabago ang dentist o petsa
  useEffect(() => {
    const { dentist, appointmentDate } = formData;
    if (!dentist || !appointmentDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    getAvailableSlots(dentist, appointmentDate)
      .then((res) => {
        if (cancelled) return;
        let list = res.data;
        // Itago ang oras na lumipas na kung ngayong araw
        if (appointmentDate === todayStr()) {
          list = list.filter((t) => t > nowTimeStr());
        }
        setSlots(list);
        // Kung hindi na available ang napiling oras, i-clear
        setFormData((prev) =>
          list.includes(prev.appointmentTime)
            ? prev
            : { ...prev, appointmentTime: "" },
        );
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.dentist, formData.appointmentDate]);

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
    } finally {
      setDataLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "appointmentDate" && value) {
      const info = closedInfo(value, closedDates);
      if (info) {
        setError(
          `The clinic is closed on ${formatDate(value)} (${info.reason}). Please pick another date.`,
        );
        setFormData({ ...formData, appointmentDate: "" });
        return;
      }
      setError("");
    }
    setFormData({ ...formData, [name]: value });
  };

  // Medical profile + the dentist's notes (optional: the rest works even if this fails)
  const loadRecords = async () => {
    try {
      const res = await getMyRecords();
      setProfile(res.data.profile);
      setNotes(res.data.notes);
    } catch (err) {
      /* ignore */
    }
  };

  const handleSaveProfile = async (data) => {
    setError("");
    setMessage("");
    setSavingProfile(true);
    try {
      const res = await updateMyProfile(data);
      setProfile(res.data);
      setMessage("Profile saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changeView = (key) => {
    setActiveView(key);
    setSidebarOpen(false); // close the sidebar after choosing (important on mobile)
    setError("");
    setMessage("");
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!formData.service) return setError("Please choose a service.");
    if (closedInfo(formData.appointmentDate, closedDates)) {
      return setError("The clinic is closed on the selected date.");
    }
    if (!formData.appointmentTime) {
      return setError("Please choose an available time.");
    }
    if (
      formData.appointmentDate === todayStr() &&
      formData.appointmentTime <= nowTimeStr()
    ) {
      return setError("Please choose a time that hasn't passed yet.");
    }

    setLoading(true);
    try {
      await bookAppointment(formData);
      setFormData(emptyForm);
      await loadData();
      setActiveView("appointments");
      setMessage("Appointment booked successfully!");
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
      setMessage("Appointment cancelled.");
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment.");
    }
  };

  /* ---------- Derived data ---------- */
  const isActive = (a) => a.status === "Pending" || a.status === "Confirmed";
  const upcoming = appointments
    .filter(isActive)
    .sort((a, b) => apptWhen(a) - apptWhen(b));
  const history = appointments
    .filter((a) => !isActive(a))
    .sort((a, b) => apptWhen(b) - apptWhen(a));
  const completedCount = appointments.filter(
    (a) => a.status === "Completed",
  ).length;
  const nextAppt = upcoming[0];

  const selectedService = services.find((s) => s._id === formData.service);
  const selectedDentist = dentists.find((d) => d._id === formData.dentist);

  /* ---------- Small render helpers ---------- */
  const renderAppointment = (appt) => {
    const date = parseDate(appt.appointmentDate);
    const canCancel = isActive(appt);
    return (
      <li key={appt._id} className="appt-card">
        <div className="appt-date" aria-hidden="true">
          <span className="appt-month">
            {date.toLocaleDateString("en-PH", { month: "short" })}
          </span>
          <span className="appt-day">{date.getDate()}</span>
        </div>
        <div className="appt-body">
          <strong>{appt.service?.name}</strong>
          <span className="appt-meta">
            {dentistLabel(appt.dentist?.user?.name)} ·{" "}
            {formatDate(appt.appointmentDate)} at{" "}
            {formatTime(appt.appointmentTime)}
          </span>
          {appt.reason && (
            <span className="appt-meta">Note: {appt.reason}</span>
          )}
        </div>
        <div className="appt-actions">
          <span className={`status-badge status-${appt.status.toLowerCase()}`}>
            {appt.status}
          </span>
          {canCancel && (
            <button
              type="button"
              className="btn-outline-danger"
              onClick={() => handleCancel(appt._id)}
            >
              Cancel
            </button>
          )}
        </div>
      </li>
    );
  };

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
            <p className="muted">Loading your dashboard...</p>
          ) : (
            <>
              {/* ---------------- Overview ---------------- */}
              {activeView === "overview" && (
                <div>
                  <h2>Welcome back, {greetingName(user?.name)}</h2>
                  <p className="page-sub">
                    Here's a summary of your dental visits.
                  </p>

                  <div className="stat-grid">
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-number">
                          {appointments.length}
                        </span>
                        <span className="stat-label">Total appointments</span>
                      </div>
                      <span className="stat-icon-wrap">
                        <ClipboardList size={22} />
                      </span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-number">{upcoming.length}</span>
                        <span className="stat-label">Upcoming</span>
                      </div>
                      <span className="stat-icon-wrap">
                        <Hourglass size={22} />
                      </span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-number">{completedCount}</span>
                        <span className="stat-label">Completed</span>
                      </div>
                      <span className="stat-icon-wrap">
                        <Check size={22} />
                      </span>
                    </div>
                  </div>

                  <h3 className="group-title">Next appointment</h3>
                  {nextAppt ? (
                    <ul className="appt-list">{renderAppointment(nextAppt)}</ul>
                  ) : (
                    <div className="empty-state">
                      <p>You have no upcoming appointments.</p>
                      <button
                        type="button"
                        className="btn-primary-sm"
                        onClick={() => changeView("book")}
                      >
                        Book an appointment
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- Book ---------------- */}
              {activeView === "book" && (
                <div>
                  <h2>Book an Appointment</h2>
                  <p className="page-sub">
                    Choose a service, then pick your dentist and schedule.
                  </p>

                  <form
                    onSubmit={handleBookAppointment}
                    className="booking-layout"
                  >
                    <div className="booking-main">
                      <section className="form-section">
                        <h3>Select a service</h3>
                        {services.length === 0 ? (
                          <p className="muted">
                            No services are available yet. Please contact the
                            clinic.
                          </p>
                        ) : (
                          <div
                            className="service-grid"
                            role="radiogroup"
                            aria-label="Dental service"
                          >
                            {services.map((s) => {
                              const { icon: Icon, desc } = getMeta(s.name);
                              const selected = formData.service === s._id;
                              return (
                                <label
                                  key={s._id}
                                  className={`service-card ${selected ? "selected" : ""}`}
                                >
                                  <input
                                    type="radio"
                                    name="service"
                                    value={s._id}
                                    checked={selected}
                                    onChange={handleChange}
                                    className="sr-only"
                                  />
                                  <span className="service-icon">
                                    <Icon size={22} />
                                  </span>
                                  <span className="service-name">{s.name}</span>
                                  <span className="service-desc">
                                    {s.description || desc}
                                  </span>
                                  <span className="service-price">
                                    {peso(s.price)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </section>

                      <section className="form-section">
                        <h3>Dentist and schedule</h3>
                        <div className="form-grid">
                          <div className="field field-wide">
                            <label htmlFor="dentist">Dentist</label>
                            <select
                              id="dentist"
                              name="dentist"
                              value={formData.dentist}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select a dentist</option>
                              {dentists.map((d) => (
                                <option key={d._id} value={d._id}>
                                  {dentistLabel(d.user?.name)} (
                                  {d.specialization})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label htmlFor="appointmentDate">Date</label>
                            <input
                              id="appointmentDate"
                              type="date"
                              name="appointmentDate"
                              min={todayStr()}
                              value={formData.appointmentDate}
                              onChange={handleChange}
                              required
                            />
                            <p className="form-hint">
                              Closed on holidays set by the clinic.
                            </p>
                          </div>
                          <div className="field">
                            <label htmlFor="appointmentTime">Time</label>
                            <select
                              id="appointmentTime"
                              name="appointmentTime"
                              value={formData.appointmentTime}
                              onChange={handleChange}
                              required
                              disabled={
                                !formData.dentist ||
                                !formData.appointmentDate ||
                                slotsLoading
                              }
                            >
                              <option value="">
                                {!formData.dentist || !formData.appointmentDate
                                  ? "Pick a dentist and date first"
                                  : slotsLoading
                                    ? "Loading..."
                                    : slots.length === 0
                                      ? "No available time"
                                      : "Select a time"}
                              </option>
                              {slots.map((t) => (
                                <option key={t} value={t}>
                                  {formatTime(t)}
                                </option>
                              ))}
                            </select>
                            <p className="form-hint">
                              Clinic hours: 9:00 AM to 3:00 PM.
                            </p>
                          </div>
                          <div className="field field-wide">
                            <label htmlFor="reason">Reason (optional)</label>
                            <input
                              id="reason"
                              type="text"
                              name="reason"
                              maxLength={200}
                              placeholder="e.g. Toothache on the lower left side"
                              value={formData.reason}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </section>
                    </div>

                    <aside className="summary-card">
                      <h3>Booking summary</h3>
                      <dl>
                        <dt>Service</dt>
                        <dd>{selectedService?.name || "Not selected"}</dd>
                        <dt>Dentist</dt>
                        <dd>
                          {selectedDentist
                            ? dentistLabel(selectedDentist.user?.name)
                            : "Not selected"}
                        </dd>
                        <dt>Date</dt>
                        <dd>
                          {formData.appointmentDate
                            ? formatDate(formData.appointmentDate)
                            : "Not selected"}
                        </dd>
                        <dt>Time</dt>
                        <dd>
                          {formData.appointmentTime
                            ? formatTime(formData.appointmentTime)
                            : "Not selected"}
                        </dd>
                      </dl>
                      <div className="summary-total">
                        <span>Estimated price</span>
                        <strong>
                          {selectedService ? peso(selectedService.price) : "—"}
                        </strong>
                      </div>
                      <button
                        type="submit"
                        className="btn-primary-sm block"
                        disabled={loading}
                      >
                        {loading ? "Booking..." : "Confirm booking"}
                      </button>
                    </aside>
                  </form>
                </div>
              )}

              {/* ---------------- My records ---------------- */}
              {activeView === "records" && (
                <div>
                  <h2>My Records</h2>
                  <p className="page-sub">
                    Your past visits and the treatment your dentist recorded.
                  </p>
                  <MyRecords appointments={appointments} notes={notes} />
                </div>
              )}

              {/* ---------------- My profile ---------------- */}
              {activeView === "profile" && (
                <div>
                  <h2>My Profile</h2>
                  <p className="page-sub">
                    Keep your personal details up to date.
                  </p>
                  <div className="form-section">
                    <MedicalProfileForm
                      profile={profile}
                      onSave={handleSaveProfile}
                      saving={savingProfile}
                      submitLabel="Save profile"
                    />
                  </div>
                </div>
              )}

              {/* ---------------- My appointments ---------------- */}
              {activeView === "appointments" && (
                <div>
                  <h2>My Appointments</h2>

                  {appointments.length === 0 ? (
                    <div className="empty-state">
                      <p>You haven't booked any appointments yet.</p>
                      <button
                        type="button"
                        className="btn-primary-sm"
                        onClick={() => changeView("book")}
                      >
                        Book an appointment
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="group-title">
                        <Clock size={16} /> Upcoming
                      </h3>
                      {upcoming.length === 0 ? (
                        <p className="muted">Nothing scheduled.</p>
                      ) : (
                        <ul className="appt-list">
                          {upcoming.map(renderAppointment)}
                        </ul>
                      )}

                      {history.length > 0 && (
                        <>
                          <h3 className="group-title">History</h3>
                          <ul className="appt-list">
                            {history.map(renderAppointment)}
                          </ul>
                        </>
                      )}
                    </>
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

export default PatientDashboard;
