import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area,
} from 'recharts';

const GRADE_COLORS = { merah: '#EF4444', kuning: '#F59E0B', hijau: '#10B981', biru: '#3B82F6' };
const GRADE_LABELS = { merah: 'Merah', kuning: 'Kuning', hijau: 'Hijau', biru: 'Biru' };
const GRADE_ORDER = ['merah', 'kuning', 'hijau', 'biru'];

const cardMeta = [
  { label: 'Total Insiden', key: 'total', icon: '📊', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Baru', key: 'baru', icon: '📝', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Diproses', key: 'diproses', icon: '⏳', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'Selesai', key: 'selesai', icon: '✅', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
];

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
    { name: 'Baru', value: stats.baru || 0, fill: '#4facfe' },
    { name: 'Diproses', value: stats.diproses || 0, fill: '#f59e0b' },
    { name: 'Selesai', value: stats.selesai || 0, fill: '#10B981' },
  ] : [];

  const trendBars = trends.length > 0 ? trends.slice(-8).map(t => ({
    name: t.periode?.length > 5 ? t.periode.slice(0, 5) : t.periode,
    total: t.total,
    merah: t.merah || 0, kuning: t.kuning || 0,
    hijau: t.hijau || 0, biru: t.biru || 0,
  })) : [];

  return (
    <div className="page">
      {/* Floating decorative particles */}
      <div className="dash-particles" aria-hidden="true">
        {['●', '●', '◆', '■', '▲', '●', '◆', '■'].map((s, i) => (
          <span key={i} className="dash-particle" style={{
            left: `${10 + (i * 12) % 80}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${4 + (i % 3) * 2}s`,
            fontSize: `${10 + (i % 4) * 6}px`,
            opacity: 0.08 + (i % 3) * 0.03,
          }}>{s}</span>
        ))}
      </div>

      <div className="page-header">
        <div>
          <h1>Dashboard Insiden Keselamatan Pasien</h1>
          <p>Selamat datang kembali, {user?.name}</p>
        </div>
        {notifCount > 0 && (
          <div className="notif-badge">
            🔔 {notifCount} belum dibaca
          </div>
        )}
      </div>

      {/* Dynamic Stat Cards */}
      <div className="stat-row">
        {cardMeta.map((c, i) => (
          <div key={c.key} className="dash-stat-card" style={{ '--card-grad': c.gradient }}
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
              const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
              e.currentTarget.style.setProperty('--rot-x', `${y}deg`);
              e.currentTarget.style.setProperty('--rot-y', `${x}deg`);
            }}
            onMouseLeave={e => {
              e.currentTarget.style.setProperty('--rot-x', `0deg`);
              e.currentTarget.style.setProperty('--rot-y', `0deg`);
            }}>
            <div className="dash-stat-glow" />
            <div className="dash-stat-icon">{c.icon}</div>
            <div className="dash-stat-body">
              <span className="dash-stat-value">{stats?.[c.key] ?? '-'}</span>
              <span className="dash-stat-label">{c.label}</span>
            </div>
            <div className="dash-stat-shine" />
          </div>
        ))}
      </div>

      {/* Row 1: Pie + Bar */}
      <div className="chart-row">
        <div className="chart-card dash-chart-card" style={{ animationDelay: '0.1s' }}>
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

        <div className="chart-card dash-chart-card" style={{ animationDelay: '0.2s' }}>
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
        <div className="chart-card dash-chart-card" style={{ animationDelay: '0.3s' }}>
          <h3 className="chart-title">Tren Bulanan</h3>
          {trendBars.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendBars} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} fill="url(#trendGrad)" dot={{ r: 3, fill: '#3B82F6' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="chart-empty">Belum ada data tren</p>}
        </div>

        <div className="chart-card dash-chart-card" style={{ animationDelay: '0.4s' }}>
          <h3 className="chart-title">Ringkasan Grade</h3>
          <div className="grade-summary">
            {severityPie.length > 0 ? severityPie.map(d => (
              <div key={d.name} className="grade-card dash-grade-card" style={{ borderLeftColor: d.color }}>
                <span className="grade-card-value" style={{ color: d.color }}>{d.value}</span>
                <span className="grade-card-label">{d.name}</span>
                <span className="grade-card-pct">
                  {((d.value / (stats?.total || 1)) * 100).toFixed(1)}%
                </span>
                <div className="dash-grade-bar" style={{ background: `${d.color}33` }}>
                  <div className="dash-grade-fill" style={{
                    width: `${((d.value / (stats?.total || 1)) * 100)}%`,
                    background: d.color,
                  }} />
                </div>
              </div>
            )) : <p className="chart-empty">Belum ada data</p>}
          </div>
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
