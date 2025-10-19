import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import './Dashboard.css';

const SummaryScreen = () => {
  const [todaySummary, setTodaySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchSummaryData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/today-summary', {
        params: {
          date: selectedDate
        }
      });
      setTodaySummary(response.data);
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const handleCheckIn = async (bookingId) => {
    if (window.confirm('Are you sure you want to check-in this customer?')) {
      try {
        await api.patch(`/bookings/${bookingId}/checkin`);
        fetchSummaryData(); // Refresh data
        alert('Customer checked-in successfully!');
      } catch (error) {
        console.error('Error checking in:', error);
        alert('Error checking in customer. Please try again.');
      }
    }
  };

  const handleCheckOut = async (bookingId) => {
    if (window.confirm('Are you sure you want to check-out this customer?')) {
      try {
        await api.patch(`/bookings/${bookingId}/checkout`);
        fetchSummaryData(); // Refresh data
        alert('Customer checked-out successfully!');
      } catch (error) {
        console.error('Error checking out:', error);
        alert('Error checking out customer. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [selectedDate, fetchSummaryData]);



  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading summary...</p>
      </div>
    );
  }

  if (!todaySummary) {
    return (
      <div className="error-state">
        <p>Failed to load summary data</p>
        <button onClick={fetchSummaryData} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="summary-screen-mobile">


      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card checkins">
          <div className="stat-number">{todaySummary.checkIns?.length || 0}</div>
          <div className="stat-label">Check-ins</div>
        </div>
        <div className="stat-card checkouts">
          <div className="stat-number">{todaySummary.checkOuts?.length || 0}</div>
          <div className="stat-label">Check-outs</div>
        </div>
        <div className="stat-card dues">
          <div className="stat-number">{todaySummary.pendingDues?.length || 0}</div>
          <div className="stat-label">Pending Dues</div>
        </div>
      </div>

      {/* Check-ins Section */}
      <div className="summary-section-mobile">
        <div className="section-header">
          <h3>📥 Check-ins</h3>
          <span className="count-badge">{todaySummary.checkIns?.length || 0}</span>
        </div>
        {todaySummary.checkIns && todaySummary.checkIns.length > 0 ? (
          <div className="booking-cards">
            {todaySummary.checkIns.map((booking, index) => (
              <div key={index} className="booking-card">
                <div className="booking-header">
                  <div className="customer-info">
                    <div className="customer-name">{booking.customerName}</div>
                    <div className="room-info">Room {booking.roomNumber}</div>
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge ${booking.bookingStatus?.toLowerCase()}`}>
                      {booking.bookingStatus}
                    </span>
                  </div>
                </div>
                <div className="booking-details">
                  <div className="detail-item">
                    <span className="detail-icon">📞</span>
                    <span className="detail-text">{booking.phoneNumber}</span>
                  </div>
                </div>
                <div className="booking-actions">
                  {booking.bookingStatus === 'CONFIRMED' && (
                    <button 
                      className="action-btn checkin-btn"
                      onClick={() => handleCheckIn(booking.bookingId)}
                    >
                      ✅ Check-in
                    </button>
                  )}
                  {booking.bookingStatus === 'CHECKEDIN' && (
                    <button 
                      className="action-btn checkout-btn"
                      onClick={() => handleCheckOut(booking.bookingId)}
                    >
                      🚪 Check-out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text">No check-ins today</div>
          </div>
        )}
      </div>

      {/* Check-outs Section */}
      <div className="summary-section-mobile">
        <div className="section-header">
          <h3>📤 Check-outs</h3>
          <span className="count-badge">{todaySummary.checkOuts?.length || 0}</span>
        </div>
        {todaySummary.checkOuts && todaySummary.checkOuts.length > 0 ? (
          <div className="booking-cards">
            {todaySummary.checkOuts.map((booking, index) => (
              <div key={index} className="booking-card">
                <div className="booking-header">
                  <div className="customer-info">
                    <div className="customer-name">{booking.customerName}</div>
                    <div className="room-info">Room {booking.roomNumber}</div>
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge ${booking.bookingStatus?.toLowerCase()}`}>
                      {booking.bookingStatus}
                    </span>
                  </div>
                </div>
                <div className="booking-details">
                  <div className="detail-item">
                    <span className="detail-icon">📞</span>
                    <span className="detail-text">{booking.phoneNumber}</span>
                  </div>
                </div>
                <div className="booking-actions">
                  {booking.bookingStatus === 'CONFIRMED' && (
                    <button 
                      className="action-btn checkin-btn"
                      onClick={() => handleCheckIn(booking.bookingId)}
                    >
                      ✅ Check-in
                    </button>
                  )}
                  {booking.bookingStatus === 'CHECKEDIN' && (
                    <button 
                      className="action-btn checkout-btn"
                      onClick={() => handleCheckOut(booking.bookingId)}
                    >
                      🚪 Check-out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text">No check-outs today</div>
          </div>
        )}
      </div>

      {/* Pending Dues Section */}
      <div className="summary-section-mobile">
        <div className="section-header">
          <h3>💳 Pending Dues</h3>
          <span className="count-badge">{todaySummary.pendingDues?.length || 0}</span>
        </div>
        {todaySummary.pendingDues && todaySummary.pendingDues.length > 0 ? (
          <div className="dues-cards">
            {todaySummary.pendingDues.map((due, index) => (
              <div key={index} className="due-card">
                <div className="due-header">
                  <div className="customer-info">
                    <div className="customer-name">{due.customerName}</div>
                    <div className="room-info">Room {due.roomNumber}</div>
                  </div>
                  <div className="due-amount">₹{due.dueAmount}</div>
                </div>
                <div className="due-details">
                  <div className="detail-item">
                    <span className="detail-icon">📞</span>
                    <span className="detail-text">{due.phoneNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">
                      {due.checkInDate} - {due.checkOutDate}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <div className="empty-text">No pending dues</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryScreen;
