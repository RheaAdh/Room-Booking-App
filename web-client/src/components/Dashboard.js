import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  
  // Room availability checker state
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const todayResponse = await api.get(`/dashboard/today-summary?date=${today}`);
      
      setTodaySummary(todayResponse.data);
      // Use today's data as dashboard summary since we don't have a separate summary endpoint
      setDashboardSummary(todayResponse.data);
      // Set empty transactions for now since we don't have a transactions endpoint
      setTransactions([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRoomAvailability = async () => {
    if (!checkInDate || !checkOutDate) {
      alert('Please select both check-in and check-out dates');
      return;
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      alert('Check-out date must be after check-in date');
      return;
    }

    setCheckingAvailability(true);
    try {
      const response = await api.get('/rooms/availability', {
        params: {
          checkInDate: checkInDate,
          checkOutDate: checkOutDate
        }
      });
      setAvailableRooms(response.data);
    } catch (error) {
      console.error('Error checking room availability:', error);
      alert('Error checking room availability. Please try again.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const StatCard = ({ title, value, color, icon }) => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  );


  const ListSection = ({ title, data, renderItem, emptyMessage = "No data available" }) => (
    <div className="list-section">
      <h3 className="section-title">{title}</h3>
      {data && data.length > 0 ? (
        <div className="list-container">
          {data.map((item, index) => (
            <div key={index} className="list-item">
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-message">{emptyMessage}</div>
      )}
    </div>
  );

  const formatSummaryForWhatsApp = () => {
    if (!todaySummary) return '';
    
    const date = new Date(todaySummary.date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    let summary = `🏨 *PROF PRIDE GUEST HOUSE*\n📅 *${date}*\n\n`;
    
    // Check-ins
    if (todaySummary.arrivals && todaySummary.arrivals.length > 0) {
      summary += `✅ *CHECK-INS (${todaySummary.arrivals.length})*\n`;
      summary += `Name | Room | Start | End | Total | Paid | Due | Mobile\n`;
      summary += `────────────────────────────────────────\n`;
      
      todaySummary.arrivals.forEach(guest => {
        summary += `${guest.name} | ${guest.room} | ${guest.start} | ${guest.end} | ₹${guest.totalCost} | ₹${guest.paid} | ₹${guest.due} | ${guest.mobile}\n`;
      });
      summary += `\n`;
    }
    
    // Check-outs
    if (todaySummary.departures && todaySummary.departures.length > 0) {
      summary += `🚪 *CHECK-OUTS (${todaySummary.departures.length})*\n`;
      summary += `Name | Room | Start | End | Total | Paid | Due | Mobile\n`;
      summary += `────────────────────────────────────────\n`;
      
      todaySummary.departures.forEach(guest => {
        summary += `${guest.name} | ${guest.room} | ${guest.start} | ${guest.end} | ₹${guest.totalCost} | ₹${guest.paid} | ₹${guest.due} | ${guest.mobile}\n`;
      });
      summary += `\n`;
    }
    
    if ((!todaySummary.arrivals || todaySummary.arrivals.length === 0) && 
        (!todaySummary.departures || todaySummary.departures.length === 0)) {
      summary += `📝 No check-ins or check-outs today.\n`;
    }
    
    summary += `\n📞 For queries: +91-9876543210`;
    
    return summary;
  };

  const copyToClipboard = () => {
    const summary = formatSummaryForWhatsApp();
    navigator.clipboard.writeText(summary).then(() => {
      alert('Summary copied to clipboard! You can now paste it in WhatsApp.');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy to clipboard. Please try again.');
    });
  };

  const createExcelGridFormat = () => {
    if (!todaySummary) return '';
    
    const date = new Date(todaySummary.date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    let html = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #2c3e50; font-size: 18px;">🏨 PROF PRIDE GUEST HOUSE</h2>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">📅 ${date}</p>
      </div>
    `;
    
    // Check-ins Table
    if (todaySummary.arrivals && todaySummary.arrivals.length > 0) {
      html += `
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; color: #27ae60; font-size: 14px;">✅ CHECK-INS (${todaySummary.arrivals.length})</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 15px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; background: #e9ecef;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background: #e9ecef;">Room</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background: #e9ecef;">Start</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background: #e9ecef;">End</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; background: #e9ecef;">Total</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; background: #e9ecef;">Paid</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; background: #e9ecef;">Due</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background: #e9ecef;">Mobile</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      todaySummary.arrivals.forEach((guest, index) => {
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        const dueColor = guest.due > 0 ? '#dc3545' : '#28a745';
        html += `
          <tr style="background: ${rowColor};">
            <td style="border: 1px solid #ddd; padding: 8px;">${guest.name}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${guest.room}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${guest.start}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${guest.end}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${guest.totalCost}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${guest.paid}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: ${dueColor}; font-weight: bold;">₹${guest.due}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${guest.mobile}</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    }
    
    // Check-outs Table
    if (todaySummary.departures && todaySummary.departures.length > 0) {
      html += `
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; color: #e74c3c; font-size: 14px;">🚪 CHECK-OUTS (${todaySummary.departures.length})</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 15px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; background: #e9ecef;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background: #e9ecef;">Room</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background: #e9ecef;">Start</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background: #e9ecef;">End</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; background: #e9ecef;">Total</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; background: #e9ecef;">Paid</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; background: #e9ecef;">Due</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background: #e9ecef;">Mobile</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      todaySummary.departures.forEach((guest, index) => {
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        const dueColor = guest.due > 0 ? '#dc3545' : '#28a745';
        html += `
          <tr style="background: ${rowColor};">
            <td style="border: 1px solid #ddd; padding: 8px;">${guest.name}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${guest.room}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${guest.start}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${guest.end}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${guest.totalCost}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${guest.paid}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: ${dueColor}; font-weight: bold;">₹${guest.due}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${guest.mobile}</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    }
    
    // No data message
    if ((!todaySummary.arrivals || todaySummary.arrivals.length === 0) && 
        (!todaySummary.departures || todaySummary.departures.length === 0)) {
      html += `
        <div style="text-align: center; padding: 20px; color: #6c757d; font-style: italic;">
          📝 No check-ins or check-outs today.
        </div>
      `;
    }
    
    // Footer
    html += `
      <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 11px;">
        📞 For queries: +91-9876543210
      </div>
    `;
    
    return html;
  };

  const copyAsImage = async () => {
    try {
      // Create a temporary div with the summary content in Excel-like grid format
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 800px;
        background: white;
        padding: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        line-height: 1.3;
        color: #333;
        border: 2px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
      `;
      
      // Create Excel-like grid format
      const gridContent = createExcelGridFormat();
      tempDiv.innerHTML = gridContent;
      document.body.appendChild(tempDiv);

      // Use html2canvas to convert to image
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        try {
          // Copy to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob
            })
          ]);
          
          alert('Summary image copied to clipboard! You can now paste it in WhatsApp.');
        } catch (err) {
          console.error('Failed to copy image: ', err);
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `daily-summary-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          alert('Image downloaded! You can now share it on WhatsApp.');
        }
        
        // Clean up
        document.body.removeChild(tempDiv);
      }, 'image/png');

    } catch (error) {
      console.error('Error creating image:', error);
      alert('Error creating image. Please try the text copy option instead.');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}


      {/* Tab Navigation */}
      <div className="tab-container">
            <button
              className={`tab ${activeTab === 'today' ? 'active' : ''}`}
              onClick={() => setActiveTab('today')}
            >
              Stats
            </button>
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Daily Summary
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
      </div>

      {activeTab === 'today' && dashboardSummary && (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <StatCard 
              title="Arrivals" 
              value={dashboardSummary.todayArrivals} 
              color="#2ecc71" 
              icon="🏠" 
            />
            <StatCard 
              title="Departures" 
              value={dashboardSummary.todayDepartures} 
              color="#e74c3c" 
              icon="🚪" 
            />
            <StatCard 
              title="Occupancy" 
              value={dashboardSummary.currentOccupancy} 
              color="#3498db" 
              icon="👥" 
            />
            <StatCard 
              title="Revenue" 
              value={`₹${dashboardSummary.todayRevenue}`} 
              color="#f39c12" 
              icon="💰" 
            />
            <StatCard 
              title="Expenses" 
              value={`₹${dashboardSummary.todayExpenses}`} 
              color="#e67e22" 
              icon="💸" 
            />
            <StatCard 
              title="Net Flow" 
              value={`₹${dashboardSummary.netCashFlow}`} 
              color={dashboardSummary.netCashFlow >= 0 ? '#27ae60' : '#e74c3c'} 
              icon="📊" 
            />
          </div>


          {/* Today's Lists */}
          <div className="row">
            <div className="col-4">
              <ListSection
                title="Today's Arrivals"
                data={dashboardSummary.arrivalsList}
                renderItem={(item) => (
                  <div>
                    <div className="list-item-header">
                      <span className="guest-name">{item.customer?.name || 'N/A'}</span>
                      <span className="booking-id">#{item.id}</span>
                    </div>
                    <div className="phone-number">{item.customer?.phoneNumber || 'N/A'}</div>
                    <div className="room-info">Room: {item.room?.roomNumber || 'N/A'}</div>
                  </div>
                )}
              />
            </div>
            
            <div className="col-4">
              <ListSection
                title="Today's Departures"
                data={dashboardSummary.departuresList}
                renderItem={(item) => (
                  <div>
                    <div className="list-item-header">
                      <span className="guest-name">{item.customer?.name || 'N/A'}</span>
                      <span className="booking-id">#{item.id}</span>
                    </div>
                    <div className="phone-number">{item.customer?.phoneNumber || 'N/A'}</div>
                    <div className="room-info">Room: {item.room?.roomNumber || 'N/A'}</div>
                  </div>
                )}
              />
            </div>
            
            <div className="col-4">
              <ListSection
                title="Outstanding Dues"
                data={dashboardSummary.duesList}
                renderItem={(item) => (
                  <div>
                    <div className="list-item-header">
                      <span className="guest-name">{item.customer?.name || 'N/A'}</span>
                      <span className="due-amount">₹{item.dueAmount || 0}</span>
                    </div>
                    <div className="phone-number">{item.customer?.phoneNumber || 'N/A'}</div>
                    <div className="room-info">Room: {item.room?.roomNumber || 'N/A'}</div>
                  </div>
                )}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'transactions' && transactions && (
        <>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">All Transactions</h3>
              <div className="transaction-stats">
                <span className="stat-badge payment">Payments: {transactions.totalPayments}</span>
                <span className="stat-badge expense">Expenses: {transactions.totalExpenses}</span>
                <span className="stat-badge total">Total: {transactions.totalTransactions}</span>
              </div>
            </div>
            <div className="card-body">
              <div className="transactions-table">
                <div className="transactions-header">
                  <div>Type</div>
                  <div>Date</div>
                  <div>Time</div>
                  <div>Amount</div>
                  <div>Details</div>
                  <div>Customer</div>
                  <div>Room</div>
                </div>
                {transactions.transactions.map((transaction, index) => (
                  <div key={index} className={`transactions-row ${transaction.type.toLowerCase()}`}>
                    <div className="transaction-type">
                      <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                        {transaction.type === 'PAYMENT' ? '💰' : '💸'}
                      </span>
                      {transaction.type}
                    </div>
                    <div>{transaction.date}</div>
                    <div>{transaction.time}</div>
                    <div className={`amount ${transaction.type.toLowerCase()}`}>
                      {transaction.type === 'PAYMENT' ? '+' : '-'}₹{transaction.amount}
                    </div>
                    <div>
                      {transaction.type === 'PAYMENT' 
                        ? `${transaction.mode} Payment` 
                        : `${transaction.category}: ${transaction.description}`
                      }
                    </div>
                    <div>{transaction.customerName}</div>
                    <div>{transaction.roomNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}


      {activeTab === 'summary' && todaySummary && (
        <>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Daily Summary - {new Date(todaySummary.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={copyToClipboard}>
                  📋 Copy Text
                </button>
                <button className="btn btn-success" onClick={copyAsImage}>
                  🖼️ Copy as Image
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Check-ins Section */}
              {todaySummary.arrivals && todaySummary.arrivals.length > 0 && (
                <div className="summary-section">
                  <h4 className="summary-title">✅ Check-ins ({todaySummary.arrivals.length})</h4>
                  <div className="summary-table">
                    <div className="summary-header">
                      <div>Name</div>
                      <div>Room</div>
                      <div>Start</div>
                      <div>End</div>
                      <div>Total</div>
                      <div>Paid</div>
                      <div>Due</div>
                      <div>Mobile</div>
                    </div>
                    {todaySummary.arrivals.map((guest, index) => (
                      <div key={index} className="summary-row">
                        <div>{guest.name}</div>
                        <div>{guest.room}</div>
                        <div>{guest.start}</div>
                        <div>{guest.end}</div>
                        <div>₹{guest.totalCost}</div>
                        <div>₹{guest.paid}</div>
                        <div className={guest.due > 0 ? 'due-amount' : 'paid-amount'}>₹{guest.due}</div>
                        <div>{guest.mobile}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Check-outs Section */}
              {todaySummary.departures && todaySummary.departures.length > 0 && (
                <div className="summary-section">
                  <h4 className="summary-title">🚪 Check-outs ({todaySummary.departures.length})</h4>
                  <div className="summary-table">
                    <div className="summary-header">
                      <div>Name</div>
                      <div>Room</div>
                      <div>Start</div>
                      <div>End</div>
                      <div>Total</div>
                      <div>Paid</div>
                      <div>Due</div>
                      <div>Mobile</div>
                    </div>
                    {todaySummary.departures.map((guest, index) => (
                      <div key={index} className="summary-row">
                        <div>{guest.name}</div>
                        <div>{guest.room}</div>
                        <div>{guest.start}</div>
                        <div>{guest.end}</div>
                        <div>₹{guest.totalCost}</div>
                        <div>₹{guest.paid}</div>
                        <div className={guest.due > 0 ? 'due-amount' : 'paid-amount'}>₹{guest.due}</div>
                        <div>{guest.mobile}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No data message */}
              {(!todaySummary.arrivals || todaySummary.arrivals.length === 0) && 
               (!todaySummary.departures || todaySummary.departures.length === 0) && (
                <div className="empty-message">
                  📝 No check-ins or check-outs today.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
