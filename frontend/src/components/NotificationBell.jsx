import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notificationsApi";
import "./notificationBell.css";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await getNotifications();
      setItems(res.data);
      setUnread(res.unreadCount);
    } catch {
      /* ignore — hindi dapat masira ang navbar */
    }
  }, []);

  // Kunin agad, tapos i-refresh kada 30 segundo
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  // Isara kapag nag-click sa labas
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleItemClick = async (n) => {
    if (n.isRead) return;
    await markNotificationRead(n._id);
    setItems((prev) =>
      prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)),
    );
    setUnread((u) => Math.max(0, u - 1));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
  };

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-btn"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel" role="menu">
          <div className="notif-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button
                type="button"
                className="notif-link"
                onClick={handleMarkAll}
              >
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="notif-empty">No notifications yet.</p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li
                  key={n._id}
                  className={`notif-item ${n.isRead ? "" : "unread"}`}
                  onClick={() => handleItemClick(n)}
                >
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                  <small>{new Date(n.createdAt).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
