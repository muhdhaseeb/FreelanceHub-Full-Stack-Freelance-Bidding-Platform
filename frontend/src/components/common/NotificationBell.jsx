import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAllRead } from "../../api/notifications";
import { useNotificationSocket } from "../../hooks/useSocket";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {}
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useNotificationSocket(useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []));

  const handleOpen = async () => {
    setOpen(prev => !prev);
    if (!open && unreadCount > 0) {
      await markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const handleClick = (n) => {
    setOpen(false);
    if (n.jobId) navigate(`/jobs/${n.jobId._id || n.jobId}`);
  };

  const iconMap = {
    new_bid: "📤", bid_accepted: "🎉", bid_rejected: "❌",
    job_completed: "✅", new_message: "💬", new_review: "⭐",
  };

  return (
    <div className="notification-wrap">
      <button className="notification-btn" onClick={handleOpen}>
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="mark-read-btn">
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 && <div className="notification-empty">No notifications yet</div>}
            {notifications.map((n) => (
              <div key={n._id} className={"notification-item" + (n.read ? "" : " notification-item--unread")} onClick={() => handleClick(n)}>
                <span className="notification-icon">{iconMap[n.type] || "🔔"}</span>
                <div className="notification-body">
                  <p>{n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}