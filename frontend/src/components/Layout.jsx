import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

const roleMenus = {
  pelapor: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Insiden Saya', icon: '📋' },
    { to: '/incidents/new', label: 'Lapor Insiden', icon: '➕' },
    { to: '/bantuan', label: 'Bantuan', icon: '❓' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
  validator: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Semua Insiden', icon: '📋' },
    { to: '/investigations', label: 'Investigasi', icon: '🔍' },
    { to: '/laporan', label: 'Laporan', icon: '📑' },
    { to: '/bantuan', label: 'Bantuan', icon: '❓' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
  pmkp: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Semua Insiden', icon: '📋' },
    { to: '/investigations', label: 'Investigasi', icon: '🔍' },
    { to: '/laporan', label: 'Laporan', icon: '📑' },
    { to: '/bantuan', label: 'Bantuan', icon: '❓' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
  kepala_unit: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Insiden Unit', icon: '📋' },
    { to: '/laporan', label: 'Laporan', icon: '📑' },
    { to: '/bantuan', label: 'Bantuan', icon: '❓' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
  manajemen: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Semua Insiden', icon: '📋' },
    { to: '/laporan', label: 'Laporan', icon: '📑' },
    { to: '/bantuan', label: 'Bantuan', icon: '❓' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Semua Insiden', icon: '📋' },
    { to: '/investigations', label: 'Investigasi', icon: '🔍' },
    { to: '/laporan', label: 'Laporan', icon: '📑' },
    { to: '/master/ruangan', label: 'Ruangan', icon: '🏥' },
    { to: '/master/users', label: 'Pengguna', icon: '👥' },
    { to: '/settings', label: 'Pengaturan', icon: '⚙️' },
    { to: '/bantuan', label: 'Bantuan', icon: '❓' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
};

export default function Layout({ children }) {
  const { user, mustChangePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appVersion, setAppVersion] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const logoUrl = localStorage.getItem('si_api_logo');

  useEffect(() => {
    api.getVersion().then(res => setAppVersion(res.version)).catch(() => {});
  }, []);

  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]');
    const stored = localStorage.getItem('si_api_logo');
    if (link && stored) {
      link.href = stored;
      link.type = '';
    }
  }, []);

  const menuItems = [...(roleMenus[user?.role] || roleMenus.pelapor)];

  const handleLogout = async () => {
    setShowLogoutModal(false);
    setLoggingOut(true);
    await new Promise(r => setTimeout(r, 2500));
    logout();
    navigate('/login');
  };

  const roleLabels = {
    pelapor: 'Pelapor', validator: 'Validator', pmkp: 'PMKP',
    kepala_unit: 'Kepala Unit', manajemen: 'Manajemen', admin: 'Admin',
  };

  const particles = [...Array(12)].map((_, i) => (
    <div key={i} className="ld-particle" style={{
      '--x': `${Math.random() * 100}%`,
      '--y': `${Math.random() * 100}%`,
      '--s': `${0.3 + Math.random() * 0.7}`,
      '--d': `${Math.random() * 3}s`,
      '--r': `${Math.random() * 360}deg`,
    }} />
  ));

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            {sidebarOpen && logoUrl ? (
              <img src={logoUrl} alt="Logo" className="sidebar-logo" />
            ) : null}
            <h2 style={{ fontSize: sidebarOpen ? '24px' : '18px' }}>{sidebarOpen ? 'SI-API' : 'SA'}</h2>
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        {sidebarOpen && (
          <div className="sidebar-user">
            <p className="user-name">{user?.name}</p>
            <p className="user-role">{roleLabels[user?.role]}</p>
          </div>
        )}
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/password" className="nav-item">
            <span className="nav-icon">🔑</span>
            {sidebarOpen && <span className="nav-label">Ganti Password</span>}
          </NavLink>
          <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            🚪 {sidebarOpen && 'Keluar'}
          </button>
          {sidebarOpen && appVersion && (
            <div className="sidebar-version">SI-API V.{appVersion}</div>
          )}
        </div>
      </aside>
      <main className="main-content">
        {mustChangePassword && (
          <div className="alert alert-warning password-warning">
            <span>⚠️ Anda menggunakan password default. Segera <NavLink to="/password">ganti password</NavLink> Anda.</span>
            <button className="btn-close" onClick={() => navigate('/password')}>&rarr;</button>
          </div>
        )}
        {children}
      </main>

      {showLogoutModal && (
        <div className="ld-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="ld-modal" onClick={e => e.stopPropagation()}>
            <div className="ld-modal-logo-wrap">
              <div className="ld-modal-ring"></div>
              <div className="ld-modal-logo">
                <img src={logoUrl || '/logo.svg'} alt="" />
              </div>
            </div>
            <h3>Keluar Aplikasi</h3>
            <p>Apakah Anda yakin ingin keluar dari aplikasi?</p>
            <div className="ld-modal-actions">
              <button className="btn" onClick={() => setShowLogoutModal(false)}>Tidak</button>
              <button className="btn btn-primary" onClick={handleLogout}>Ya</button>
            </div>
          </div>
        </div>
      )}

      {loggingOut && (
        <div className="login-loading-overlay">
          <div className="login-loading-3d">
            <div className="ld-orbit">
              <div className="ld-ring-orbit ld-ring-orbit-1"></div>
              <div className="ld-ring-orbit ld-ring-orbit-2"></div>
              <div className="ld-ring-orbit ld-ring-orbit-3"></div>
              <div className="ld-ring-orbit ld-ring-orbit-4"></div>
              <div className="ld-ring-orbit ld-ring-orbit-5"></div>
              <div className="ld-circle-logo">
                <img src={logoUrl || '/logo.svg'} alt="" />
              </div>
            </div>
            <div className="ld-text">Keluar</div>
            <div className="ld-dots">
              <span className="ld-dot"></span>
              <span className="ld-dot"></span>
              <span className="ld-dot"></span>
            </div>
          </div>
          <div className="ld-particles">{particles}</div>
        </div>
      )}
    </div>
  );
}
