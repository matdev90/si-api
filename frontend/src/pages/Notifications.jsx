import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/client';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = () => {
    api.getNotifications().then(res => {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    }).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkAllRead = async () => {
    await api.markAllRead();
    fetchData();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Notifikasi</h1>
        {unreadCount > 0 && (
          <button className="btn" onClick={handleMarkAllRead}>
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {unreadCount > 0 && (
        <div className="alert alert-info">{unreadCount} notifikasi belum dibaca</div>
      )}

      <div className="notification-list">
        {notifications.map(n => (
          <div key={n.id} className={`notification-item ${n.is_read ? '' : 'unread'}`}>
            <div className="notif-header">
              <span className="notif-type">{n.type.replace('_', ' ')}</span>
              <span className="notif-date">{new Date(n.created_at).toLocaleDateString('id-ID')}</span>
            </div>
            <p className="notif-message">{n.message}</p>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="empty">Belum ada notifikasi</p>
        )}
      </div>
    </div>
  );
}
