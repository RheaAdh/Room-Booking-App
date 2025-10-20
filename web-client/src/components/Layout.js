import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Check notification status
    setNotificationEnabled(notificationService.isEnabled());
  }, []);

  const menuItems = [
    { path: '/adminpvt/summary', label: 'Summary', icon: '📋' },
    { path: '/adminpvt/contacts', label: 'Contacts', icon: '👥' },
    { path: '/adminpvt/bookings', label: 'Bookings', icon: '📝' },
    { path: '/adminpvt/booking-grid', label: 'Booking Grid', icon: '📅' },
    { path: '/adminpvt/rooms', label: 'Rooms', icon: '🏢' },
    { path: '/adminpvt/booking-requests', label: 'Booking Requests', icon: '📨' },
    { path: '/adminpvt/expenses', label: 'Expenses', icon: '💸' },
    { path: '/adminpvt/transactions', label: 'Transactions', icon: '💳' },
    { path: '/adminpvt/stats', label: 'Stats', icon: '📊' }
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNotificationToggle = async () => {
    if (notificationEnabled) {
      // Notifications are enabled, we can't disable them programmatically
      alert('To disable notifications, please go to your browser settings and block notifications for this site.');
    } else {
      // Request permission to enable notifications
      const hasPermission = await notificationService.requestPermission();
      setNotificationEnabled(hasPermission);
      
      if (hasPermission) {
        alert('✅ Notifications enabled! You will now receive booking request alerts.');
      } else {
        alert('❌ Notifications blocked. Please enable them in your browser settings to receive booking alerts.');
      }
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h1 className="sidebar-title">Room Booking</h1>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
              ✕
            </button>
          </div>
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
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <h2 className="page-title">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
          <button 
            className={`notification-toggle ${notificationEnabled ? 'enabled' : 'disabled'}`}
            onClick={handleNotificationToggle}
            title={notificationEnabled ? 'Notifications enabled' : 'Click to enable notifications'}
          >
            {notificationEnabled ? '🔔' : '🔕'}
          </button>
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
