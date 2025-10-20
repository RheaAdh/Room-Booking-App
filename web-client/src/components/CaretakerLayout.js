import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CaretakerLayout.css';

const CaretakerLayout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/adminpvt/summary', label: 'Today\'s Summary', icon: '📋', shortLabel: 'Summary' },
    { path: '/adminpvt/bookings', label: 'Bookings', icon: '📝', shortLabel: 'Bookings' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="caretaker-app">


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
        <button 
          className="bottom-nav-item logout-nav-btn" 
          onClick={handleLogout} 
          title="Logout"
        >
          <span className="bottom-nav-icon">🚪</span>
          <span className="bottom-nav-label">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default CaretakerLayout;
