import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/adminpvt/summary', label: 'Summary', icon: '📋' },
    { path: '/adminpvt/contacts', label: 'Contacts', icon: '👥' },
    { path: '/adminpvt/bookings', label: 'Bookings', icon: '📝' },
    { path: '/adminpvt/booking-grid', label: 'Booking Grid', icon: '📅' },
    { path: '/adminpvt/rooms', label: 'Rooms', icon: '🏢' },
    { path: '/adminpvt/booking-requests', label: 'Booking Requests', icon: '📨' },
    { path: '/adminpvt/expenses', label: 'Expenses', icon: '💸' },
    { path: '/adminpvt/transactions', label: 'Transactions', icon: '💳' },
    { path: '/adminpvt/stats', label: 'Stats', icon: '📊' },
    { path: '/adminpvt/room-availability', label: 'Room Availability', icon: '🏠' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">Room Booking</h1>
          <p className="sidebar-subtitle">Management System</p>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <button className="logout-btn" onClick={logout}>
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
                  onClick={() => setSidebarOpen(false)}
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
      <div className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <h2 className="page-title">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
        </div>

        {/* Page Content */}
        <div className="content">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default Layout;
