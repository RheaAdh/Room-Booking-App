import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import './BookingGrid.css';

const BookingGrid = () => {
  const [rooms, setRooms] = useState([]);
  const [dates, setDates] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      // Generate dates for the next 30 days
      const startDate = new Date();
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
            room: room
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
      // Show booking details in a modal or alert
      const { name, bookingStatus, customer, room } = cellData;
      alert(`Booking Details:\n\nCustomer: ${name}\nStatus: ${getStatusText(bookingStatus)}\nPhone: ${customer?.phoneNumber || 'N/A'}\nEmail: ${customer?.email || 'N/A'}\nRoom: ${room?.roomNumber || 'N/A'} (${room?.roomType || 'N/A'})`);
    }
  };

  const renderCell = (cellData, roomIndex, dateIndex) => {
    const { name, bookingStatus, bookingId, customer } = cellData;
    
    if (!name) {
      return <div className="grid-cell empty"></div>;
    }

    const displayName = name.length > 8 ? name.substring(0, 8) + '...' : name;
    
    return (
      <div 
        className="grid-cell occupied clickable"
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
    <div className="booking-grid">
      <div className="page-header">
        <h1>Booking Grid</h1>
        <button 
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Room Occupancy Grid (Next 30 Days)</h3>
          <div className="grid-summary">
            <span className="badge badge-info">{rooms.length} Rooms</span>
            <span className="badge badge-success">{dates.length} Days</span>
            <span className="badge badge-warning">{gridData.flat().filter(cell => cell.name).length} Bookings</span>
          </div>
        </div>
        <div className="card-body">
          {rooms.length === 0 ? (
            <div className="empty-state">
              <p>No rooms found. Create some rooms first!</p>
            </div>
          ) : (
            <div className="grid-container">
              <div className="grid-wrapper">
                {/* Header row with dates */}
                <div className="grid-header">
                  <div className="room-header">Room</div>
                  {dates.map((date, index) => (
                    <div key={index} className="date-header">
                      {formatDate(date)}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                {rooms.map((room, roomIndex) => (
                  <div key={room.id} className="grid-row">
                    <div className="room-label">{room.roomNumber} ({room.roomType})</div>
                    {dates.map((date, dateIndex) => (
                      <div key={dateIndex} className="grid-cell-container">
                        {renderCell(gridData[roomIndex]?.[dateIndex], roomIndex, dateIndex)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Status Legend</h3>
        </div>
        <div className="card-body">
          <div className="legend">
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
              <div className="legend-color" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}></div>
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingGrid;
