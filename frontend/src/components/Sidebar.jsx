import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ items, activeView, setActiveView, isOpen }) => {
  const { logout } = useAuth();

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-menu">
        {items.map((item) => (
          <button
            key={item.key}
            className={`sidebar-item ${activeView === item.key ? "active" : ""}`}
            onClick={() => setActiveView(item.key)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <button className="sidebar-item sidebar-logout" onClick={logout}>
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
