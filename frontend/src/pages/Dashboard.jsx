import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(() => {});
    api.getDashboardTrends().then(setTrends).catch(() => {});
    api.getNotifications().then(n => setNotifCount(n.unreadCount)).catch(() => {});
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Selamat datang, {user?.name}</p>
      </div>

      {notifCount > 0 && (
        <div className="alert alert-info">
          Anda memiliki {notifCount} notifikasi belum dibaca
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card total"><span className="stat-value">{stats.total}</span><span className="stat-label">Total Insiden</span></div>
          <div className="stat-card baru"><span className="stat-value">{stats.baru}</span><span className="stat-label">Baru</span></div>
          <div className="stat-card proses"><span className="stat-value">{stats.diproses}</span><span className="stat-label">Diproses</span></div>
          <div className="stat-card selesai"><span className="stat-value">{stats.selesai}</span><span className="stat-label">Selesai</span></div>
          <div className="stat-card merah"><span className="stat-value">{stats.merah}</span><span className="stat-label">Merah</span></div>
          <div className="stat-card kuning"><span className="stat-value">{stats.kuning}</span><span className="stat-label">Kuning</span></div>
          <div className="stat-card hijau"><span className="stat-value">{stats.hijau}</span><span className="stat-label">Hijau</span></div>
          <div className="stat-card biru"><span className="stat-value">{stats.biru}</span><span className="stat-label">Biru</span></div>
        </div>
      )}

      {trends.length > 0 && (
        <div className="card">
          <h3>Tren Insiden (Bulanan)</h3>
          <table className="table">
            <thead>
              <tr><th>Periode</th><th>Total</th><th>🔴 Merah</th><th>🟡 Kuning</th><th>🟢 Hijau</th><th>🔵 Biru</th></tr>
            </thead>
            <tbody>
              {trends.map(t => (
                <tr key={t.periode}>
                  <td>{t.periode}</td>
                  <td>{t.total}</td>
                  <td>{t.merah || 0}</td>
                  <td>{t.kuning || 0}</td>
                  <td>{t.hijau || 0}</td>
                  <td>{t.biru || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!stats && <p>Memuat data dashboard...</p>}
    </div>
  );
}
