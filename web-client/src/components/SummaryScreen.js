import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import './Dashboard.css';

const SummaryScreen = () => {
  const [todaySummary, setTodaySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
    <div className="summary-screen">
      <div className="page-header">
        <h1>📋 Daily Summary</h1>
        <div className="header-actions">
          <div className="date-picker-container">
            <label htmlFor="date-picker">Select Date:</label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
            />
          </div>
          <button className="btn btn-primary" onClick={fetchSummaryData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Daily Summary - {new Date(selectedDate).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</h3>
        </div>
        <div className="card-body">
          <div className="summary-content">
            <div className="summary-section">
              <h4>📥 Check-ins ({todaySummary.checkIns?.length || 0})</h4>
              {todaySummary.checkIns && todaySummary.checkIns.length > 0 ? (
                <div className="table-container">
                  <table className="pending-dues-table">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>Room</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaySummary.checkIns.map((booking, index) => (
                        <tr key={index}>
                          <td className="customer-name">{booking.customerName}</td>
                          <td className="room-number">{booking.roomNumber}</td>
                          <td className="phone-number">{booking.phoneNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No check-ins for this date</p>
              )}
            </div>

            <div className="summary-section">
              <h4>📤 Check-outs ({todaySummary.checkOuts?.length || 0})</h4>
              {todaySummary.checkOuts && todaySummary.checkOuts.length > 0 ? (
                <div className="table-container">
                  <table className="pending-dues-table">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>Room</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaySummary.checkOuts.map((booking, index) => (
                        <tr key={index}>
                          <td className="customer-name">{booking.customerName}</td>
                          <td className="room-number">{booking.roomNumber}</td>
                          <td className="phone-number">{booking.phoneNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No check-outs for this date</p>
              )}
            </div>

            <div className="summary-section">
              <h4>💳 Pending Dues ({todaySummary.pendingDues?.length || 0})</h4>
              {todaySummary.pendingDues && todaySummary.pendingDues.length > 0 ? (
                <div className="summary-list">
                  <div className="table-container">
                    <table className="pending-dues-table">
                      <thead>
                        <tr>
                          <th>Customer Name</th>
                          <th>Due Amount</th>
                          <th>Phone Number</th>
                          <th>Room No.</th>
                          <th>Check-in Date</th>
                          <th>Check-out Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todaySummary.pendingDues.map((due, index) => (
                          <tr key={index}>
                            <td className="customer-name">{due.customerName}</td>
                            <td className="due-amount">₹{due.dueAmount}</td>
                            <td className="phone-number">{due.phoneNumber}</td>
                            <td className="room-number">{due.roomNumber}</td>
                            <td className="checkin-date">{due.checkInDate}</td>
                            <td className="checkout-date">{due.checkOutDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="no-data">No pending dues</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryScreen;
