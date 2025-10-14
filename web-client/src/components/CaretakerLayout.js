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
    { path: '/adminpvt/room-availability', label: 'Room Availability', icon: '🏠', shortLabel: 'Rooms' },
    { path: '/adminpvt/bookings', label: 'Bookings', icon: '📝', shortLabel: 'Bookings' },
    { path: '/adminpvt/contacts', label: 'Contacts', icon: '👥', shortLabel: 'Contacts' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="caretaker-app">
      {/* Mobile Header */}
      <header className="caretaker-header">
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Menu">
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <div className="header-actions">
          <span className="user-badge">{user?.name}</span>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Sidebar */}
      <aside className={`caretaker-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Caretaker Portal</h2>
          <p>Quick Access Menu</p>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <p>Welcome, {user?.name}</p>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="caretaker-main">
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
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.shortLabel}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default CaretakerLayout;
