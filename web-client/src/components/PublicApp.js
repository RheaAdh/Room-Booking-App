import React, { useState, useEffect } from 'react';
import PublicRoomView from './PublicRoomView';
import CustomerAuth from './CustomerAuth';
import CustomerDashboard from './CustomerDashboard';
import InfoScreen from './InfoScreen';
import ErrorBoundary from './ErrorBoundary';
import './PublicApp.css';

const PublicApp = () => {
  const [currentView, setCurrentView] = useState('rooms'); // 'rooms', 'info', 'auth', 'dashboard'
  const [customer, setCustomer] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  // Always show dashboard for logged-in customers
  useEffect(() => {
    if (customer) {
      setCurrentView('dashboard');
    }
  }, [customer]);

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
            {/* Mobile Social Links */}
            <div className="mobile-brand-social">
              <a 
                href="https://www.instagram.com/stay_at_professionalspride" 
                target="_blank" 
                rel="noopener noreferrer"
                className="nav-social-link instagram"
                title="Follow us on Instagram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.79 0-1.418.632-1.418 1.418s.628 1.418 1.418 1.418 1.418-.632 1.418-1.418-.628-1.418-1.418-1.418z"/>
                </svg>
              </a>
              <a 
                href="https://www.facebook.com/professionalspride/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="nav-social-link facebook"
                title="Follow us on Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {!customer && (
            <>
              
              {/* Social Media Links */}
              <div className="nav-social">
                <a 
                  href="https://www.instagram.com/stay_at_professionalspride" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="nav-social-link instagram"
                  title="Follow us on Instagram"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.79 0-1.418.632-1.418 1.418s.628 1.418 1.418 1.418 1.418-.632 1.418-1.418-.628-1.418-1.418-1.418z"/>
                  </svg>
                  <span className="social-handle">@stay_at_professionalspride</span>
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
                  <span className="social-handle">@professionalspride</span>
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
                  <span className="social-handle">Whitefield, Bangalore</span>
                </a>
              </div>
              
              {/* Mobile Menu Button */}
              <button 
                className="mobile-menu-btn"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Toggle menu"
              >
                ☰
              </button>
            </>
          )}
          
          <div className="nav-actions">
            {customer ? (
              <div className="customer-info">
                <span className="welcome-text">Hello, {customer.name}</span>
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
                  className="btn btn-secondary btn-login"
                  onClick={handleShowAuth}
                >
                  Login
                </button>
                <button 
                  className="btn btn-primary btn-book-now"
                  onClick={() => setCurrentView(currentView === 'info' ? 'rooms' : 'info')}
                >
                  {currentView === 'info' ? 'Browse Rooms' : 'About Us'}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && !customer && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            <button 
              className={`mobile-menu-item ${currentView === 'rooms' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('rooms');
                setShowMobileMenu(false);
              }}
            >
              🏠 View Rooms
            </button>
            <button 
              className={`mobile-menu-item ${currentView === 'info' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('info');
                setShowMobileMenu(false);
              }}
            >
              ℹ️ About Us
            </button>
          </div>
        </div>
      )}

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
        
        {currentView === 'info' && (
          <ErrorBoundary>
            <InfoScreen />
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
                <li><button onClick={() => setCurrentView('info')}>About Us</button></li>
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
