import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

const GRADE_COLORS = { merah: '#EF4444', kuning: '#F59E0B', hijau: '#10B981', biru: '#3B82F6' };
const GRADE_LABELS = { merah: 'Merah', kuning: 'Kuning', hijau: 'Hijau', biru: 'Biru' };
const GRADE_ORDER = ['merah', 'kuning', 'hijau', 'biru'];

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

  const severityPie = stats ? GRADE_ORDER.filter(k => stats[k] > 0).map(k => ({
    name: GRADE_LABELS[k], value: stats[k], color: GRADE_COLORS[k],
  })) : [];

  const statusBars = stats ? [
    { name: 'Baru', value: stats.baru || 0, fill: '#3B82F6' },
    { name: 'Diproses', value: stats.diproses || 0, fill: '#F59E0B' },
    { name: 'Selesai', value: stats.selesai || 0, fill: '#10B981' },
  ] : [];

  const trendBars = trends.length > 0 ? trends.slice(-8).map(t => ({
    name: t.periode?.length > 5 ? t.periode.slice(0, 5) : t.periode,
    Total: t.total,
    Merah: t.merah || 0, Kuning: t.kuning || 0,
    Hijau: t.hijau || 0, Biru: t.biru || 0,
  })) : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Selamat datang kembali, {user?.name}</p>
        </div>
        {notifCount > 0 && (
          <div className="notif-badge">
            🔔 {notifCount} belum dibaca
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stat-row">
        {[
          { label: 'Total Insiden', value: stats?.total, icon: '📊', cls: 'blue' },
          { label: 'Baru', value: stats?.baru, icon: '📝', cls: 'indigo' },
          { label: 'Diproses', value: stats?.diproses, icon: '⏳', cls: 'amber' },
          { label: 'Selesai', value: stats?.selesai, icon: '✅', cls: 'green' },
        ].map(s => (
          <div key={s.label} className="stat-card-modern">
            <div className={`stat-card-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-card-body">
              <span className="stat-card-value">{s.value ?? '-'}</span>
              <span className="stat-card-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Pie + Bar */}
      <div className="chart-row">
        <div className="chart-card">
          <h3 className="chart-title">Distribusi Severity</h3>
          {severityPie.length > 0 ? (
            <div className="donut-wrapper">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={severityPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                    {severityPie.map(e => (
                      <Cell key={e.name} fill={e.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Insiden']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-legend">
                {severityPie.map(d => (
                  <div key={d.name} className="legend-item">
                    <span className="legend-dot" style={{ background: d.color }} />
                    <span className="legend-label">{d.name}</span>
                    <span className="legend-value">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="chart-empty">Belum ada data</p>}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Status Insiden</h3>
          {statusBars.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusBars} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={24} label={{
                  position: 'right', fontSize: 11, fontWeight: 600, fill: '#374151',
                  formatter: v => v || '',
                }}>
                  {statusBars.map(e => <Cell key={e.name} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="chart-empty">Belum ada data</p>}
        </div>
      </div>

      {/* Row 2: Trend + Grade Summary */}
      <div className="chart-row">
        <div className="chart-card">
          <h3 className="chart-title">Tren Bulanan</h3>
          {trendBars.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendBars} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="chart-empty">Belum ada data tren</p>}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Ringkasan Grade</h3>
          {severityPie.length > 0 ? (
            <div className="grade-summary">
              {severityPie.map(d => (
                <div key={d.name} className="grade-card" style={{ borderLeftColor: d.color }}>
                  <span className="grade-card-value" style={{ color: d.color }}>{d.value}</span>
                  <span className="grade-card-label">{d.name}</span>
                  <span className="grade-card-pct">
                    {((d.value / (stats?.total || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={severityPie} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {severityPie.map(e => <Cell key={e.name} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grade Legend */}
      <div className="grade-bar">
        {GRADE_ORDER.map(k => (
          <div key={k} className="grade-bar-item" style={{ background: GRADE_COLORS[k] }}>
            {GRADE_LABELS[k]}
          </div>
        ))}
      </div>

      {!stats && !trends.length && (
        <div className="loading" style={{ minHeight: 200 }}>
          <div className="spinner" />
          <p>Memuat data dashboard...</p>
        </div>
      )}
    </div>
  );
}
