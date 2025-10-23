import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CaretakerLayout.css';

const CaretakerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/adminpvt/summary', label: 'Today\'s Summary', icon: '📋', shortLabel: 'Summary' },
    { path: '/adminpvt/bookings', label: 'Bookings', icon: '📝', shortLabel: 'Bookings' },
  ];

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Auto-close sidebar on mobile when navigating
  const handleNavClick = () => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="caretaker-app">
      {/* Sidebar */}
      <div className={`caretaker-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h1 className="sidebar-title">Room Booking</h1>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
              ✕
            </button>
          </div>
          <p className="sidebar-subtitle">Caretaker Panel</p>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        
        <nav>
          <ul className="sidebar-nav">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                  onClick={handleNavClick}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <main className="caretaker-main">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <h2 className="page-title">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Caretaker Dashboard'}
          </h2>
        </div>

        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="bottom-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.shortLabel}</span>
          </Link>
        ))}
        <button 
          className="bottom-nav-item logout-nav-btn" 
          onClick={handleLogout} 
          title="Logout"
        >
          <span className="bottom-nav-icon">🚪</span>
          <span className="bottom-nav-label">Logout</span>
        </button>
      </nav>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default CaretakerLayout;
