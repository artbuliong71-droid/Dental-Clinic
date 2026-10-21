import { useEffect, useState } from "react";
import { Search, UserRound } from "lucide-react";
import {
  searchWalkInPatients,
  createWalkInAppointment,
} from "../api/walkInApi";
import { getAvailableSlots } from "../api/appointmentsApi";
import { dentistLabel, formatTime } from "../utils/dateUtils";
import "./manage.css";
import "./walkIn.css";

const todayStr = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const emptyForm = {
  service: "",
  dentist: "",
  date: todayStr(),
  time: "",
};

const WalkInView = ({ services = [], dentists = [], onBooked }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [slots, setSlots] = useState([]);
  const [slotMsg, setSlotMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Naglo-load agad pagbukas, at nagfi-filter habang nagta-type
  useEffect(() => {
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchWalkInPatients(query.trim());
        setResults(res.data);
        setError("");
      } catch (err) {
        setResults([]);
        setError(err.response?.data?.message || "Could not load patients.");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleSearch = (e) => e.preventDefault();
  const loadSlots = async (dentist, date) => {
    setSlots([]);
    setSlotMsg("");
    if (!dentist || !date) return;
    try {
      const res = await getAvailableSlots(dentist, date);
      if (res.closed) setSlotMsg(`Clinic is closed (${res.reason}).`);
      else if (res.data.length === 0) setSlotMsg("No available slots.");
      setSlots(res.data);
    } catch {
      setSlotMsg("Could not load time slots.");
    }
  };

  const change = (field, value) => {
    const next = { ...form, [field]: value };
    if (field === "dentist" || field === "date") next.time = "";
    setForm(next);
    if (field === "dentist" || field === "date") {
      loadSlots(next.dentist, next.date);
    }
  };

  const openForm = (p) => {
    // Isa lang ang dentist? Piliin na agad
    const onlyDentist = dentists.length === 1 ? dentists[0]._id : "";
    const next = { ...emptyForm, date: todayStr(), dentist: onlyDentist };

    setSelected(p);
    setForm(next);
    setSlots([]);
    setSlotMsg("");
    setError("");
    setSuccess("");
    if (onlyDentist) loadSlots(onlyDentist, next.date);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createWalkInAppointment({
        patientId: selected.patientId,
        dentist: form.dentist,
        service: form.service,
        appointmentDate: form.date,
        appointmentTime: form.time,
      });
      setSuccess(`Walk-in appointment recorded for ${selected.name}.`);
      setSelected(null);
      setForm(emptyForm);
      if (onBooked) await onBooked();
    } catch (err) {
      setError(err.response?.data?.message || "Could not record appointment.");
    } finally {
      setSaving(false);
    }
  };

  const activeServices = services.filter((s) => s.isActive !== false);

  return (
    <div>
      <h2>Walk-in Patients</h2>
      <p className="muted">
        Search for the patient's existing account, then record their visit.
      </p>

      <form className="manage-toolbar" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, email or phone number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search patients"
          />
        </div>
        <button
          type="submit"
          className="btn-primary-sm"
          disabled={searching || query.trim().length < 2}
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <p className="walkin-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="walkin-success" role="status">
          {success}
        </p>
      )}

      {!searching && results.length === 0 && (
        <div className="empty-state">
          <p>
            {query.trim()
              ? "No existing patient account found. Ask the patient to register first."
              : "No registered patients yet."}
          </p>
        </div>
      )}
      {results.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full name</th>
                <th>Email</th>
                <th>Phone</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((p) => (
                <tr key={p.patientId}>
                  <td data-label="Full name">
                    <strong>{p.name}</strong>
                  </td>
                  <td data-label="Email">{p.email}</td>
                  <td data-label="Phone">{p.phone || "—"}</td>
                  <td data-label="Action" className="col-action">
                    <button
                      type="button"
                      className="btn-primary-sm sm"
                      onClick={() => openForm(p)}
                    >
                      Book walk-in
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <form className="walkin-form" onSubmit={handleSubmit}>
          <h3>
            <UserRound size={18} aria-hidden="true" /> {selected.name}
          </h3>
          <p className="muted">
            {selected.email} · {selected.phone || "no phone"}
          </p>

          <label>
            Service
            <select
              required
              value={form.service}
              onChange={(e) => change("service", e.target.value)}
            >
              <option value="">Select a service</option>
              {activeServices.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                  {s.price != null ? ` — ₱${s.price}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Dentist
            <select
              required
              value={form.dentist}
              onChange={(e) => change("dentist", e.target.value)}
            >
              <option value="">Select a dentist</option>
              {dentists.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.user?.name ? dentistLabel(d.user.name) : d._id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date
            <input
              type="date"
              required
              min={todayStr()}
              value={form.date}
              onChange={(e) => change("date", e.target.value)}
            />
          </label>

          <label>
            Time
            <select
              required
              value={form.time}
              onChange={(e) => change("time", e.target.value)}
              disabled={slots.length === 0}
            >
              <option value="">
                {form.dentist ? "Select a time" : "Choose a dentist first"}
              </option>
              {slots.map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>
            {slotMsg && <small className="muted">{slotMsg}</small>}
          </label>

          <div className="walkin-actions">
            <button
              type="button"
              className="chip"
              onClick={() => setSelected(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-sm"
              disabled={saving || !form.time}
            >
              {saving ? "Saving..." : "Book appointment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WalkInView;
