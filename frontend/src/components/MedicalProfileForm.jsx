import { useEffect, useState } from "react";
import { todayStr } from "../utils/dateUtils";
import "./manage.css";

const toForm = (p) => ({
  birthdate: p?.birthdate ? String(p.birthdate).slice(0, 10) : "",
  gender: p?.gender || "",
  address: p?.address || "",
});

/** Personal details form. Shared by the patient ("My Profile") and the admin (patient record). */
const MedicalProfileForm = ({
  profile,
  onSave,
  saving,
  onCancel,
  submitLabel = "Save",
}) => {
  const [form, setForm] = useState(toForm(profile));
  const [errors, setErrors] = useState({});

  useEffect(() => setForm(toForm(profile)), [profile]);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.birthdate && form.birthdate > todayStr())
      errs.birthdate = "Birthdate can't be in the future.";
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSave(form);
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="mp-birthdate">Birthdate</label>
          <input
            id="mp-birthdate"
            type="date"
            name="birthdate"
            max={todayStr()}
            value={form.birthdate}
            onChange={change}
            className={errors.birthdate ? "invalid" : ""}
          />
          {errors.birthdate && (
            <p className="field-error" role="alert">
              {errors.birthdate}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="mp-gender">Gender</label>
          <select
            id="mp-gender"
            name="gender"
            value={form.gender}
            onChange={change}
          >
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
        <div className="field field-wide">
          <label htmlFor="mp-address">Address</label>
          <input
            id="mp-address"
            type="text"
            name="address"
            maxLength={250}
            value={form.address}
            onChange={change}
          />
        </div>
      </div>
      <div className="form-actions record-actions">
        <button type="submit" className="btn-primary-sm" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default MedicalProfileForm;
