import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import './Dashboard.css';

const SummaryScreen = () => {
  const navigate = useNavigate();
  const [todaySummary, setTodaySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashAmount, setCashAmount] = useState(0);
  const [allPayments, setAllPayments] = useState([]);
  const [cashFilterStartDate, setCashFilterStartDate] = useState(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDayOfMonth.toISOString().split('T')[0];
  });
  const [cashFilterEndDate, setCashFilterEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCashFilter, setShowCashFilter] = useState(false);

  const fetchSummaryData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryResponse, paymentsResponse] = await Promise.all([
        api.get('/dashboard/today-summary', {
          params: {
            date: selectedDate
          }
        }),
        api.get('/payments')
      ]);
      
      setTodaySummary(summaryResponse.data);
      setAllPayments(paymentsResponse.data || []);
      
      // Calculate total cash collected from payments with paymentMethod = 'CARETAKER' within the filtered date range
      const startDate = new Date(cashFilterStartDate);
      const endDate = new Date(cashFilterEndDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      
      console.log('💰 Cash calculation for date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPayments: paymentsResponse.data?.length || 0
      });
      
      const caretakerPayments = paymentsResponse.data?.filter(payment => {
        if (payment.paymentMethod !== 'CARETAKER') {
          return false;
        }
        const paymentDate = new Date(payment.paymentDate || payment.createdAt);
        const isInRange = paymentDate >= startDate && paymentDate <= endDate;
        console.log('💰 Payment check:', {
          id: payment.id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.paymentDate,
          createdAt: payment.createdAt,
          parsedDate: paymentDate.toISOString(),
          isInRange
        });
        return isInRange;
      }) || [];
      
      console.log('💰 CARETAKER payments found:', caretakerPayments);
      
      const totalCashCollected = caretakerPayments.reduce((total, payment) => total + (payment.amount || 0), 0);
      
      console.log('💰 Total cash collected:', totalCashCollected);
      
      setCashAmount(totalCashCollected);
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, cashFilterStartDate, cashFilterEndDate]);

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

  const handleBookingClick = (bookingId) => {
    navigate(`/adminpvt/bookings?bookingId=${bookingId}`);
  };

  const handleCashFilterUpdate = async () => {
    try {
      const response = await api.get(`/payments/cash-filter`, {
        params: {
          startDate: cashFilterStartDate,
          endDate: cashFilterEndDate,
          paymentMode: 'CARETAKER'
        }
      });
      
      if (response.data.success) {
        setCashAmount(response.data.amountInHand);
        setShowCashFilter(false);
      } else {
        console.error('Error fetching cash filter:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching cash filter:', error);
    }
  };

  const handleCashFilterReset = () => {
    const today = new Date().toISOString().split('T')[0];
    setCashFilterStartDate(today);
    setCashFilterEndDate(today);
    setShowCashFilter(false);
    // Recalculate with today's date
    setTimeout(() => {
      const newCashAmount = calculateCashFromPayments();
      setCashAmount(newCashAmount);
    }, 100);
  };


  const calculateCashFromPayments = () => {
    const startDate = new Date(cashFilterStartDate);
    const endDate = new Date(cashFilterEndDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date
    
    return allPayments
      ?.filter(payment => {
        if (payment.paymentMethod !== 'CARETAKER') {
          return false;
        }
        
        // Check if payment date is within the filter range
        const paymentDate = new Date(payment.paymentDate || payment.createdAt);
        return paymentDate >= startDate && paymentDate <= endDate;
      })
      ?.reduce((total, payment) => total + (payment.amount || 0), 0) || 0;
  };

  useEffect(() => {
    fetchSummaryData();
  }, [selectedDate, fetchSummaryData]);

  // Update cash amount when payments change
  useEffect(() => {
    if (allPayments.length > 0) {
      const cashFromPayments = calculateCashFromPayments();
      setCashAmount(cashFromPayments);
    }
  }, [allPayments, cashFilterStartDate, cashFilterEndDate]);



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
        <div className="stat-card cash">
          <div className="stat-number">Rs.{cashAmount.toLocaleString()}</div>
          <div className="stat-label">Cash to Return</div>
          <div className="stat-date-range">
            {new Date(cashFilterStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(cashFilterEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </div>
          <div className="stat-filter" onClick={() => setShowCashFilter(!showCashFilter)}>
            📅 Filter
          </div>
        </div>
      </div>

      {/* Cash Filter Modal */}
      {showCashFilter && (
        <div className="cash-filter-modal">
          <div className="cash-filter-content">
            <div className="cash-filter-header">
              <h3>💰 Filter Cash to Return</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCashFilter(false)}
              >
                ×
              </button>
            </div>
            <div className="cash-filter-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    value={cashFilterStartDate}
                    onChange={(e) => setCashFilterStartDate(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    value={cashFilterEndDate}
                    onChange={(e) => setCashFilterEndDate(e.target.value)}
                    className="form-control"
                    min={cashFilterStartDate}
                  />
                </div>
              </div>
              <div className="cash-filter-preview">
                <div className="preview-item">
                  <span>Filtered Amount:</span>
                  <span className="preview-amount">Rs.{calculateCashFromPayments().toLocaleString()}</span>
                </div>
                <div className="preview-note">
                  Showing CARETAKER payments between {cashFilterStartDate} and {cashFilterEndDate}
                </div>
              </div>
            </div>
            <div className="cash-filter-footer">
              <button 
                className="btn btn-secondary"
                onClick={handleCashFilterReset}
              >
                Reset to Today
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCashFilterUpdate}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-ins Section */}
      <div className={`summary-section-mobile ${(!todaySummary.checkIns || todaySummary.checkIns.length === 0) ? 'compact-section' : ''}`}>
        <div className="section-header">
          <h3>📥 Check-ins</h3>
          <span className="count-badge">{todaySummary.checkIns?.length || 0}</span>
        </div>
        {todaySummary.checkIns && todaySummary.checkIns.length > 0 ? (
          <div className="booking-cards">
            {todaySummary.checkIns.map((booking, index) => (
              <div 
                key={index} 
                className="booking-card clickable-booking-card one-liner-modern-card"
                onClick={() => handleBookingClick(booking.bookingId)}
              >
                <div className="one-liner-modern-content">
                  <div className="one-liner-main-info">
                    <span className="customer-name">{booking.customerName}</span>
                    <span className="room-info">Room {booking.roomNumber}</span>
                    <span className="phone-info">📞 {booking.phoneNumber}</span>
                    {booking.dueAmount && booking.dueAmount > 0 && (
                      <span className="due-amount">💰 Rs.{booking.dueAmount}</span>
                    )}
                  </div>
                  <div className="one-liner-actions" onClick={(e) => e.stopPropagation()}>
                    <span className={`status-badge ${booking.bookingStatus?.toLowerCase()}`}>
                      {booking.bookingStatus}
                    </span>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <div className="empty-text">No check-ins today</div>
          </div>
        )}
      </div>

      {/* Check-outs Section */}
      <div className={`summary-section-mobile ${(!todaySummary.checkOuts || todaySummary.checkOuts.length === 0) ? 'compact-section' : ''}`}>
        <div className="section-header">
          <h3>📤 Check-outs</h3>
          <span className="count-badge">{todaySummary.checkOuts?.length || 0}</span>
        </div>
        {todaySummary.checkOuts && todaySummary.checkOuts.length > 0 ? (
          <div className="booking-cards">
            {todaySummary.checkOuts.map((booking, index) => (
              <div 
                key={index} 
                className="booking-card clickable-booking-card one-liner-modern-card"
                onClick={() => handleBookingClick(booking.bookingId)}
              >
                <div className="one-liner-modern-content">
                  <div className="one-liner-main-info">
                    <span className="customer-name">{booking.customerName}</span>
                    <span className="room-info">Room {booking.roomNumber}</span>
                    <span className="phone-info">📞 {booking.phoneNumber}</span>
                    {booking.dueAmount && booking.dueAmount > 0 && (
                      <span className="due-amount">💰 Rs.{booking.dueAmount}</span>
                    )}
                  </div>
                  <div className="one-liner-actions" onClick={(e) => e.stopPropagation()}>
                    <span className={`status-badge ${booking.bookingStatus?.toLowerCase()}`}>
                      {booking.bookingStatus}
                    </span>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <div className="empty-text">No check-outs today</div>
          </div>
        )}
      </div>

      {/* Pending Dues Section */}
      <div className={`summary-section-mobile ${(!todaySummary.pendingDues || todaySummary.pendingDues.length === 0) ? 'compact-section' : ''}`}>
        <div className="section-header">
          <h3>💳 Pending Dues</h3>
          <span className="count-badge">{todaySummary.pendingDues?.length || 0}</span>
        </div>
        {todaySummary.pendingDues && todaySummary.pendingDues.length > 0 ? (
          <div className="booking-cards">
            {todaySummary.pendingDues.map((due, index) => (
              <div 
                key={index} 
                className="booking-card clickable-booking-card one-liner-modern-card"
                onClick={() => handleBookingClick(due.bookingId)}
              >
                <div className="one-liner-modern-content">
                  <div className="one-liner-main-info">
                    <span className="customer-name">{due.customerName}</span>
                    <span className="phone-info">📞 {due.phoneNumber}</span>
                    <span className="due-amount">💰 Rs.{due.dueAmount}</span>
                  </div>
                  <div className="one-liner-actions">
                    <span className="status-badge pending">
                      PENDING
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <div className="empty-text">No pending dues</div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SummaryScreen;
