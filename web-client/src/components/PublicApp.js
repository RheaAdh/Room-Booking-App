import React, { useState, useEffect } from 'react';
import PublicRoomView from './PublicRoomView';
import CustomerAuth from './CustomerAuth';
import CustomerDashboard from './CustomerDashboard';
import ErrorBoundary from './ErrorBoundary';
import './PublicApp.css';

const PublicApp = () => {
  const [currentView, setCurrentView] = useState('rooms'); // 'rooms', 'auth', 'dashboard'
  const [customer, setCustomer] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check if customer is already logged in
    const customerToken = localStorage.getItem('customerToken');
    const customerData = localStorage.getItem('customerData');
    
    if (customerToken && customerData) {
      try {
        const parsedCustomer = JSON.parse(customerData);
        setCustomer(parsedCustomer);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error parsing customer data:', error);
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerData');
      }
    }
  }, []);

  const handleLogin = (customerData) => {
    setCustomer(customerData);
    setCurrentView('dashboard');
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    setCustomer(null);
    setCurrentView('rooms');
  };

  const handleShowAuth = () => {
    setShowAuth(true);
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
  };

  const handleRefreshDashboard = () => {
    setRefreshTrigger(prev => prev + 1);
  };


  return (
    <div className="public-app">
      {/* Navigation */}
      <nav className="public-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <h2>🏨 Professionals Pride</h2>
          </div>
          
          <div className="nav-actions">
            <div className="nav-social">
              <a 
                href="https://www.instagram.com/flatforrent.whitefield/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="nav-social-link instagram"
                title="Follow us on Instagram"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://www.facebook.com/professionalspride/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="nav-social-link facebook"
                title="Follow us on Facebook"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://maps.app.goo.gl/P5ow6PgSzf6tspDh8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="nav-social-link maps"
                title="Find us on Google Maps"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </a>
            </div>
            
            {customer ? (
              <div className="customer-info">
                <span>Welcome, {customer.name}</span>
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentView('dashboard')}
                >
                  My Dashboard
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleShowAuth}
                >
                  Login / Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="public-main">
        {currentView === 'rooms' && (
          <ErrorBoundary>
            <PublicRoomView 
              customer={customer}
              onShowAuth={handleShowAuth}
              onBookingRequestSubmitted={handleRefreshDashboard}
            />
          </ErrorBoundary>
        )}
        
        {currentView === 'dashboard' && customer && (
          <CustomerDashboard 
            customer={customer} 
            onLogout={handleLogout}
            onShowRooms={() => setCurrentView('rooms')}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* Auth Modal */}
      {showAuth && (
        <CustomerAuth 
          onLogin={handleLogin}
          onClose={handleCloseAuth}
        />
      )}

      {/* Footer */}
      <footer className="public-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>🏨 Professionals Pride</h4>
              <p>Your comfortable stay awaits. Experience hospitality at its finest.</p>
            </div>
            
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><button onClick={() => setCurrentView('rooms')}>View Rooms</button></li>
                {customer && (
                  <li><button onClick={() => setCurrentView('dashboard')}>My Dashboard</button></li>
                )}
                <li><button onClick={handleShowAuth}>
                  {customer ? 'Account Settings' : 'Login / Register'}
                </button></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Contact</h4>
              <p>📞 +91 9731177065</p>
              <p>📧 professionalspride@gmail.com</p>
              <p>📍 Whitefield, Bangalore, Karnataka</p>
            </div>
            
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-links">
                <a 
                  href="https://www.instagram.com/flatforrent.whitefield/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link instagram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>
                <a 
                  href="https://www.facebook.com/professionalspride/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link facebook"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>
                <a 
                  href="https://maps.app.goo.gl/P5ow6PgSzf6tspDh8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link maps"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Find Us
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 Professionals Pride. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicApp;
