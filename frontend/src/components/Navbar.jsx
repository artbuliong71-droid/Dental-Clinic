// src/components/Navbar.jsx
import { useAuth } from "../context/AuthContext";
import { Menu } from "lucide-react";
// Change this path if your logo lives somewhere else.
import logo from "../assets/logo.jpg";

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
          <span>{user.name}</span>
          <span className="role-pill">{user.role}</span>
        </div>
      )}
    </div>
  );
};

export default Navbar;
