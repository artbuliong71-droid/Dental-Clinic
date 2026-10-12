import { useAuth } from "../context/AuthContext";

const Navbar = ({ onBurgerClick }) => {
  const { user, logout } = useAuth();

  return (
    <div className="navbar">
      <div style={{ display: "flex", alignItems: "center" }}>
        <button className="burger-btn" onClick={onBurgerClick}>
          ☰
        </button>
        <h1>🦷 Germino Dental</h1>
      </div>
      {user && (
        <div>
          <span style={{ marginRight: "1rem" }}>
            {user.name} ({user.role})
          </span>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
