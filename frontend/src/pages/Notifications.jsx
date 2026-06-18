import { useState, useEffect } from 'react';
import * as api from '../api/client';
import Pagination from '../components/Pagination';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = () => {
    api.getNotifications().then(res => {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    }).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const paginatedNotifs = pageSize > 0
    ? notifications.slice((page - 1) * pageSize, page * pageSize)
    : notifications;

  const handleMarkAllRead = async () => {
    await api.markAllRead();
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus notifikasi ini?')) return;
    await api.deleteNotification(id);
    fetchData();
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    if (!confirm(`Hapus semua ${notifications.length} notifikasi?`)) return;
    await api.deleteAllNotifications();
    fetchData();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Notifikasi</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {notifications.length > 0 && (
            <button className="btn" onClick={handleDeleteAll} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
              Hapus Semua
            </button>
          )}
          {unreadCount > 0 && (
            <button className="btn" onClick={handleMarkAllRead}>
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="alert alert-info">{unreadCount} notifikasi belum dibaca</div>
      )}

      <div className="notification-list">
        {paginatedNotifs.map(n => (
          <div key={n.id} className={`notification-item ${n.is_read ? '' : 'unread'}`}>
            <div className="notif-header">
              <span className="notif-type">{n.type.replace('_', ' ')}</span>
              <span className="notif-date">{new Date(n.created_at).toLocaleDateString('id-ID')}</span>
              <button
                className="notif-delete-btn"
                onClick={() => handleDelete(n.id)}
                title="Hapus notifikasi"
              >
                ✕
              </button>
            </div>
            <p className="notif-message">{n.message}</p>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="empty">Belum ada notifikasi</p>
        )}
      </div>

      <Pagination total={notifications.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}
