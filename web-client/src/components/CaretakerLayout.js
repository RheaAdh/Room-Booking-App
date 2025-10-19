import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CaretakerLayout.css';

const CaretakerLayout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/adminpvt/summary', label: 'Today\'s Summary', icon: '📋', shortLabel: 'Summary' },
    { path: '/adminpvt/room-availability', label: 'Room Availability', icon: '🏠', shortLabel: 'Rooms' },
    { path: '/adminpvt/bookings', label: 'Bookings', icon: '📝', shortLabel: 'Bookings' },
    { path: '/adminpvt/contacts', label: 'Contacts', icon: '👥', shortLabel: 'Contacts' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="caretaker-app">
      {/* Header */}
      <header className="caretaker-header">
        <div className="header-title">
          <h1>Caretaker Portal</h1>
          <p>Welcome, {user?.name}</p>
        </div>

        <div className="header-actions">
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </header>

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
