import { useAuth } from "../context/AuthContext";
import { Menu } from "lucide-react";
import NotificationBell from "./NotificationBell";
import logo from "../assets/logo.jpg";

// Display names only. The real role value stays "admin" because the backend checks for it.
const ROLE_LABELS = {
  admin: "Super Admin",
  staff: "Staff",
  patient: "Patient",
};

const Navbar = ({ onBurgerClick }) => {
  const { user } = useAuth();

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="burger-btn"
          onClick={onBurgerClick}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        <h1>
          <img src={logo} alt="" className="navbar-logo" />
          Germino-Punzal Dental
        </h1>
      </div>
      {user && (
        <div className="navbar-user">
          {user.role === "patient" && <NotificationBell />}
          <span>{user.name}</span>
          <span className="role-pill">
            {ROLE_LABELS[user.role] || user.role}
          </span>
        </div>
      )}
    </div>
  );
};

export default Navbar;
