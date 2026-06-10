import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleMenus = {
  pelapor: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Insiden Saya', icon: '📋' },
    { to: '/incidents/new', label: 'Lapor Insiden', icon: '➕' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
  validator: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Semua Insiden', icon: '📋' },
    { to: '/investigations', label: 'Investigasi', icon: '🔍' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
  pmkp: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Semua Insiden', icon: '📋' },
    { to: '/investigations', label: 'Investigasi', icon: '🔍' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
  kepala_unit: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Insiden Unit', icon: '📋' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
  manajemen: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Semua Insiden', icon: '📋' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incidents', label: 'Semua Insiden', icon: '📋' },
    { to: '/investigations', label: 'Investigasi', icon: '🔍' },
    { to: '/notifications', label: 'Notifikasi', icon: '🔔' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const menuItems = roleMenus[user?.role] || roleMenus.pelapor;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    pelapor: 'Pelapor', validator: 'Validator', pmkp: 'PMKP',
    kepala_unit: 'Kepala Unit', manajemen: 'Manajemen', admin: 'Admin',
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h2>{sidebarOpen ? 'SI-API' : 'SA'}</h2>
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
          <button className="logout-btn" onClick={handleLogout}>
            🚪 {sidebarOpen && 'Keluar'}
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
