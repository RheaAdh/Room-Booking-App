import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import './BookingGrid.css';

const BookingGrid = () => {
  const [rooms, setRooms] = useState([]);
  const [dates, setDates] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookingData();
  }, []);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, roomsRes, customersRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/rooms'),
        api.get('/customer')
      ]);
      
      const bookings = bookingsRes.data;
      const roomsData = roomsRes.data;
      const customersData = customersRes.data;

      // Generate dates for the next 30 days starting from yesterday
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // Start from yesterday
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const allDates = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        allDates.push(new Date(d).toISOString().split('T')[0]);
      }
      setDates(allDates);

      // Get unique room IDs from bookings, sorted by room ID
      const uniqueRoomIds = [...new Set(bookings.map(booking => booking.roomId).filter(Boolean))].sort();
      
      // Create room mapping for display
      const roomMap = {};
      roomsData.forEach(room => {
        roomMap[room.id] = room;
      });
      
      // Create customer mapping for display
      const customerMap = {};
      customersData.forEach(customer => {
        customerMap[customer.phoneNumber] = customer;
      });
      
      // Store room objects instead of just IDs for better display
      const roomsWithData = uniqueRoomIds.map(roomId => roomMap[roomId]).filter(Boolean);
      setRooms(roomsWithData);

      // Create grid data
      const grid = roomsWithData.map(room => {
        return allDates.map(date => {
          const booking = bookings.find(b => 
            b.roomId === room.id &&
            new Date(b.checkInDate) <= new Date(date) &&
            new Date(b.checkOutDate) > new Date(date) &&
            b.bookingStatus !== 'CANCELLED'
          );
          
          const customer = booking ? customerMap[booking.customerPhoneNumber] : null;
          const customerName = customer ? customer.name : (booking ? `Customer ${booking.customerPhoneNumber}` : '');
          
          return {
            name: customerName,
            bookingStatus: booking ? booking.bookingStatus : '',
            bookingId: booking ? booking.id : null,
            customer: customer || (booking ? { phoneNumber: booking.customerPhoneNumber } : null),
            room: room,
            booking: booking // Include the full booking object
          };
        });
      });
      
      setGridData(grid);
      
      // Debug information
      console.log('Booking Grid Debug:', {
        totalBookings: bookings.length,
        totalRooms: roomsData.length,
        totalCustomers: customersData.length,
        uniqueRooms: uniqueRoomIds,
        dateRange: `${allDates[0]} to ${allDates[allDates.length - 1]}`,
        gridData: grid
      });
    } catch (error) {
      console.error('Error fetching booking data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookingData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return '#17a2b8';
      case 'CONFIRMED': return '#28a745';
      case 'CHECKED_IN': return '#ffc107';
      case 'CHECKED_OUT': return '#6c757d';
      case 'CANCELLED': return '#dc3545';
      default: return '#f8f9fa';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'NEW': return 'New';
      case 'CONFIRMED': return 'Confirmed';
      case 'CHECKED_IN': return 'Checked In';
      case 'CHECKED_OUT': return 'Checked Out';
      case 'CANCELLED': return 'Cancelled';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleCellClick = (cellData) => {
    if (cellData.bookingId) {
      setSelectedBooking(cellData);
      setShowBookingModal(true);
    }
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
  };

  const renderCell = (cellData, roomIndex, dateIndex) => {
    const { name, bookingStatus, customer } = cellData;
    
    if (!name) {
      return (
        <div className="cell-content">
          <div className="excel-cell-empty"></div>
        </div>
      );
    }

    const displayName = name.length > 10 ? name.substring(0, 10) + '...' : name;
    
    return (
      <div 
        className="excel-cell-occupied"
        style={{ backgroundColor: getStatusColor(bookingStatus) }}
        title={`${name} - ${getStatusText(bookingStatus)} (${customer?.phoneNumber || 'No phone'}) - Click for details`}
        onClick={() => handleCellClick(cellData)}
      >
        <div className="cell-content">
          <div className="customer-name">{displayName}</div>
          {bookingStatus && (
            <div className="booking-status">{getStatusText(bookingStatus)}</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading booking grid...</p>
      </div>
    );
  }

  return (
    <div className="excel-grid-container">
      {/* Excel-style toolbar */}
      <div className="excel-toolbar">
        <div className="toolbar-left">
          <h1 className="excel-title">📊 Booking Grid</h1>
          <div className="excel-info">
            <span className="info-item">{rooms.length} Rooms</span>
            <span className="info-item">{dates.length} Days</span>
            <span className="info-item">{gridData.flat().filter(cell => cell.name).length} Bookings</span>
          </div>
        </div>
        <div className="toolbar-right">
          <button 
            className="excel-btn refresh-btn"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh Data"
          >
            {refreshing ? '⏳' : '🔄'} {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Excel-style grid */}
      <div className="excel-grid-wrapper">
        {rooms.length === 0 ? (
          <div className="excel-empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Rooms Found</h3>
            <p>Create some rooms first to see the booking grid!</p>
          </div>
        ) : (
          <div className="excel-grid">
            {/* Excel-style header */}
            <div className="excel-header">
              <div className="excel-cell room-header-cell">
                <div className="cell-content">
                  <span className="header-text">Room</span>
                </div>
              </div>
              {dates.map((date, index) => (
                <div key={index} className="excel-cell date-header-cell">
                  <div className="cell-content">
                    <span className="date-text">{formatDate(date)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Excel-style data rows */}
            {rooms.map((room, roomIndex) => (
              <div key={room.id} className="excel-row">
                <div className="excel-cell room-cell">
                  <div className="cell-content">
                    <span className="room-number">{room.roomNumber}</span>
                    <span className="room-type">({room.roomType})</span>
                  </div>
                </div>
                {dates.map((date, dateIndex) => (
                  <div key={dateIndex} className="excel-cell data-cell">
                    {renderCell(gridData[roomIndex]?.[dateIndex], roomIndex, dateIndex)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Excel-style status bar */}
      <div className="excel-status-bar">
        <div className="status-left">
          <span className="status-text">Ready</span>
        </div>
        <div className="status-right">
          <div className="status-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#17a2b8' }}></div>
              <span>New</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#28a745' }}></div>
              <span>Confirmed</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ffc107' }}></div>
              <span>Checked In</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#6c757d' }}></div>
              <span>Checked Out</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#dc3545' }}></div>
              <span>Cancelled</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ffffff', border: '1px solid #d0d7de' }}></div>
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="booking-modal-overlay" onClick={closeBookingModal}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <div className="booking-modal-title">
                <h2>📋 Booking Details</h2>
                <div className="booking-status-badge" style={{ backgroundColor: getStatusColor(selectedBooking.bookingStatus) }}>
                  {getStatusText(selectedBooking.bookingStatus)}
                </div>
              </div>
              <button className="booking-modal-close" onClick={closeBookingModal}>
                ✕
              </button>
            </div>
            
            <div className="booking-modal-content">
              <div className="booking-details-grid">
                <div className="detail-section">
                  <h3>👤 Customer Information</h3>
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedBooking.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedBooking.customer?.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedBooking.customer?.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>🏨 Room Information</h3>
                  <div className="detail-item">
                    <span className="detail-label">Room Number:</span>
                    <span className="detail-value">{selectedBooking.room?.roomNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Room Type:</span>
                    <span className="detail-value">{selectedBooking.room?.roomType || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bathroom Type:</span>
                    <span className="detail-value">{selectedBooking.room?.bathroomType || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>📅 Booking Information</h3>
                  <div className="detail-item">
                    <span className="detail-label">Booking ID:</span>
                    <span className="detail-value">#{selectedBooking.bookingId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      <span className="status-indicator" style={{ backgroundColor: getStatusColor(selectedBooking.bookingStatus) }}>
                        {getStatusText(selectedBooking.bookingStatus)}
                      </span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Check-in Date:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.checkInDate ? 
                        new Date(selectedBooking.booking.checkInDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Check-out Date:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.checkOutDate ? 
                        new Date(selectedBooking.booking.checkOutDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.checkInDate && selectedBooking.booking?.checkOutDate ? 
                        Math.ceil((new Date(selectedBooking.booking.checkOutDate) - new Date(selectedBooking.booking.checkInDate)) / (1000 * 60 * 60 * 24)) + ' days' : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Booking Type:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.bookingDurationType || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Number of People:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.numberOfPeople || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>💰 Financial Information</h3>
                  <div className="detail-item">
                    <span className="detail-label">Daily Rate:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.dailyCost ? `₹${selectedBooking.booking.dailyCost}` : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Monthly Rate:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.monthlyCost ? `₹${selectedBooking.booking.monthlyCost}` : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Early Check-in Cost:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.earlyCheckinCost ? `₹${selectedBooking.booking.earlyCheckinCost}` : '₹0'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Late Check-out Cost:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.lateCheckoutCost ? `₹${selectedBooking.booking.lateCheckoutCost}` : '₹0'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Amount:</span>
                    <span className="detail-value total-amount">
                      {selectedBooking.booking?.totalAmount ? `₹${selectedBooking.booking.totalAmount}` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>📝 Additional Information</h3>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.createdAt ? 
                        new Date(selectedBooking.booking.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Updated:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.updatedAt ? 
                        new Date(selectedBooking.booking.updatedAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Remarks:</span>
                    <span className="detail-value">
                      {selectedBooking.booking?.remarks || 'No remarks'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="booking-actions">
                <button className="action-btn primary">
                  ✏️ Edit Booking
                </button>
                <button className="action-btn secondary">
                  💳 Add Payment
                </button>
                <button className="action-btn success">
                  📄 Generate Invoice
                </button>
                <button className="action-btn warning">
                  📧 Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingGrid;
