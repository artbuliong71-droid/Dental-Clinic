import { useAuth } from "../context/AuthContext";
import { Menu, ShieldCheck } from "lucide-react";

const Navbar = ({ onBurgerClick }) => {
  const { user } = useAuth();

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="burger-btn" onClick={onBurgerClick}>
          <Menu size={24} />
        </button>
        <h1>
          <ShieldCheck size={22} />
          Germino Dental
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
