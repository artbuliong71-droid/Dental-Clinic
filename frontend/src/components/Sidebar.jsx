const Sidebar = ({ items, activeView, setActiveView, isOpen }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      {items.map((item) => (
        <button
          key={item.key}
          className={`sidebar-item ${activeView === item.key ? "active" : ""}`}
          onClick={() => setActiveView(item.key)}
        >
          {item.icon} {item.label}
        </button>
      ))}
    </div>
  );
};

export default Sidebar;
