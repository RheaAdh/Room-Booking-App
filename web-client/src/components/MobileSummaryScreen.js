import React, { useState, useEffect, useRef } from 'react';
import api from '../config/api';
import html2canvas from 'html2canvas';
import './MobileSummaryScreen.css';

const MobileSummaryScreen = () => {
  const [todaySummary, setTodaySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const summaryRef = useRef(null);

  useEffect(() => {
    fetchSummaryData();
  }, [selectedDate]);

  const fetchSummaryData = async () => {
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
  };

  const copySummaryAsImage = async () => {
    if (!summaryRef.current) return;
    
    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(summaryRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob
            })
          ]);
          alert('✅ Summary copied to clipboard! You can now paste it in WhatsApp.');
        } catch (err) {
          console.error('Failed to copy image to clipboard:', err);
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `daily-summary-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('📥 Image downloaded instead (clipboard not supported)');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('❌ Failed to generate summary image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-loading">
        <div className="loading-spinner"></div>
        <p>Loading summary...</p>
      </div>
    );
  }

  if (!todaySummary) {
    return (
      <div className="mobile-error">
        <div className="error-icon">⚠️</div>
        <h3>Failed to load summary</h3>
        <p>Please check your connection and try again.</p>
        <button onClick={fetchSummaryData} className="mobile-btn mobile-btn-primary">
          🔄 Retry
        </button>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="mobile-summary">
      {/* Header */}
      <div className="summary-header">
        <h1>📋 Daily Summary</h1>
        <p className="summary-date">{formatDate(selectedDate)}</p>
      </div>

      {/* Date Picker */}
      <div className="date-section">
        <label htmlFor="date-picker" className="date-label">📅 Select Date</label>
        <input
          id="date-picker"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-input"
        />
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={fetchSummaryData} 
          className="mobile-btn mobile-btn-secondary"
          disabled={loading}
        >
          🔄 Refresh
        </button>
        <button 
          onClick={copySummaryAsImage} 
          className="mobile-btn mobile-btn-primary"
          disabled={isGeneratingImage}
        >
          {isGeneratingImage ? '⏳ Generating...' : '📷 Copy as Image'}
        </button>
      </div>

      {/* Summary Content */}
      <div className="summary-content" ref={summaryRef}>
        {/* Summary Table */}
        <div className="summary-table-container">
          <div className="table-header">
            <h3>📋 Daily Summary</h3>
            <div className="summary-stats">
              <span className="stat-item">📥 {todaySummary.checkIns?.length || 0}</span>
              <span className="stat-item">📤 {todaySummary.checkOuts?.length || 0}</span>
              <span className="stat-item">💰 {todaySummary.pendingDues?.length || 0}</span>
            </div>
          </div>
          
          <div className="table-wrapper">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Time/Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Check-ins */}
                {todaySummary.checkIns && todaySummary.checkIns.map((booking, index) => (
                  <tr key={`checkin-${index}`} className="checkin-row">
                    <td className="name-cell">{booking.customerName}</td>
                    <td className="phone-cell">{booking.customerPhone}</td>
                    <td className="room-cell">{booking.roomNumber}</td>
                    <td className="type-cell">📥 Check-in</td>
                    <td className="time-cell">{booking.checkInTime}</td>
                  </tr>
                ))}
                
                {/* Check-outs */}
                {todaySummary.checkOuts && todaySummary.checkOuts.map((booking, index) => (
                  <tr key={`checkout-${index}`} className="checkout-row">
                    <td className="name-cell">{booking.customerName}</td>
                    <td className="phone-cell">{booking.customerPhone}</td>
                    <td className="room-cell">{booking.roomNumber}</td>
                    <td className="type-cell">📤 Check-out</td>
                    <td className="time-cell">{booking.checkOutTime}</td>
                  </tr>
                ))}
                
                {/* Pending Dues */}
                {todaySummary.pendingDues && todaySummary.pendingDues.map((booking, index) => (
                  <tr key={`due-${index}`} className="due-row">
                    <td className="name-cell">{booking.customerName}</td>
                    <td className="phone-cell">{booking.customerPhone}</td>
                    <td className="room-cell">{booking.roomNumber}</td>
                    <td className="type-cell">💰 Due</td>
                    <td className="amount-cell">₹{booking.dueAmount}</td>
                  </tr>
                ))}
                
                {/* No data row */}
                {(!todaySummary.checkIns?.length && !todaySummary.checkOuts?.length && !todaySummary.pendingDues?.length) && (
                  <tr className="no-data-row">
                    <td colSpan="5" className="no-data-cell">
                      <span className="no-data-icon">😴</span>
                      <span>No activities for this date</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSummaryScreen;
