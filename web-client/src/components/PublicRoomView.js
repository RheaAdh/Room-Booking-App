import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import './PublicRoomView.css';

const PublicRoomView = ({ onShowAuth, customer, onBookingRequestSubmitted }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [filters, setFilters] = useState({
    roomType: '',
    bathroomType: ''
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerPhone: '',
    checkInDate: '',
    checkOutDate: '',
    bookingDurationType: 'DAILY',
    dailyCost: '',
    monthlyCost: '',
    totalAmount: 0
  });

  const calculateTotalCost = useCallback((room, durationType, days) => {
    let baseCost = 0;
    if (durationType === 'DAILY' && room.dailyReferenceCost) {
      baseCost = room.dailyReferenceCost * days;
    } else if (durationType === 'MONTHLY' && room.monthlyReferenceCost) {
      baseCost = room.monthlyReferenceCost;
    } else if (room.dailyReferenceCost) {
      baseCost = room.dailyReferenceCost * days;
    }
    return baseCost;
  }, []);

  const handleBookRoom = useCallback((room) => {
    if (!checkInDate || !checkOutDate) {
      alert('Please select check-in and check-out dates first to proceed with booking');
      return;
    }
    
    // Check if user is logged in
    if (!customer) {
      // Store the room and dates for after login
      const bookingInfo = {
        room,
        checkInDate,
        checkOutDate
      };
      localStorage.setItem('pendingBooking', JSON.stringify(bookingInfo));
      onShowAuth();
      return;
    }
    
    // User is logged in, proceed with booking
    const days = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
    const totalCost = calculateTotalCost(room, 'DAILY', days);
    
    setSelectedRoom(room);
    setBookingData({
      customerName: customer.name,
      customerPhone: customer.phoneNumber,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      bookingDurationType: 'DAILY',
      dailyCost: room.dailyReferenceCost || 0,
      monthlyCost: room.monthlyReferenceCost || 0,
      totalAmount: totalCost
    });
    setShowBookingModal(true);
  }, [checkInDate, checkOutDate, customer, onShowAuth, calculateTotalCost]);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    // Check for pending booking after customer login
    if (customer) {
      const pendingBooking = localStorage.getItem('pendingBooking');
      if (pendingBooking) {
        try {
          const bookingInfo = JSON.parse(pendingBooking);
          setCheckInDate(bookingInfo.checkInDate);
          setCheckOutDate(bookingInfo.checkOutDate);
          localStorage.removeItem('pendingBooking');
          
          // Trigger booking for the pending room
          setTimeout(() => {
            handleBookRoom(bookingInfo.room);
          }, 500);
        } catch (error) {
          console.error('Error processing pending booking:', error);
          localStorage.removeItem('pendingBooking');
        }
      }
    }
  }, [customer, handleBookRoom]);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
      // You could show a user-friendly error message here
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!checkInDate || !checkOutDate) {
      alert('Please select both check-in and check-out dates');
      return;
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      alert('Check-out date must be after check-in date');
      return;
    }

    try {
      const checkInDateTime = new Date(checkInDate + 'T10:00:00').toISOString();
      const checkOutDateTime = new Date(checkOutDate + 'T10:00:00').toISOString();
      
      const response = await api.get('/rooms/check-availability', {
        params: {
          checkInDate: checkInDateTime,
          checkOutDate: checkOutDateTime
        }
      });
      setAvailableRooms(response.data || []);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableRooms([]);
      alert('Failed to check room availability. Please try again.');
    }
  };


  const handleBookingTypeChange = (bookingType) => {
    const days = getDaysDifference();
    const newTotalCost = calculateTotalCost(selectedRoom, bookingType, days);
    
    setBookingData(prev => ({
      ...prev,
      bookingDurationType: bookingType,
      totalAmount: newTotalCost
    }));
  };


  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const bookingRequest = {
        ...bookingData,
        roomId: selectedRoom.id,
        checkInDate: new Date(bookingData.checkInDate).toISOString(),
        checkOutDate: new Date(bookingData.checkOutDate).toISOString(),
        totalAmount: bookingData.totalAmount
      };

      await api.post('/booking-requests', bookingRequest);
      setShowBookingModal(false);
      setShowBookingSuccess(true);
      setSelectedRoom(null);
      
      // Trigger dashboard refresh if callback is provided
      if (onBookingRequestSubmitted) {
        onBookingRequestSubmitted();
      }
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowBookingSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting booking request:', error);
      alert('Failed to submit booking request. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysDifference = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filterRooms = (roomsToFilter) => {
    return roomsToFilter.filter(room => {
      const roomTypeMatch = !filters.roomType || room.roomType === filters.roomType;
      const bathroomTypeMatch = !filters.bathroomType || room.bathroomType === filters.bathroomType;
      return roomTypeMatch && bathroomTypeMatch;
    });
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="public-room-view">
      {/* Header */}
      <header className="public-header">
        <div className="container">
          <h1>🏨 Professionals Pride</h1>
          <p>Your comfortable stay awaits</p>
        </div>
      </header>

      {/* Search Section */}
      <div className="search-section">
        <div className="container">
          <div className="search-form">
            <div className="form-group">
              <label>Check-in Date</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Check-out Date</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate}
                className="form-control"
              />
            </div>
            <button 
              className="btn btn-primary"
              onClick={checkAvailability}
              disabled={!checkInDate || !checkOutDate}
            >
              🔍 Check Availability
            </button>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <h3>Filter Rooms</h3>
            <div className="filters-form">
              <div className="form-group">
                <label>Room Type</label>
                <select
                  value={filters.roomType}
                  onChange={(e) => handleFilterChange('roomType', e.target.value)}
                  className="form-control"
                >
                  <option value="">All Room Types</option>
                  <option value="SINGLE">Single</option>
                  <option value="DOUBLE">Double</option>
                  <option value="TRIPLE">Triple</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bathroom Type</label>
                <select
                  value={filters.bathroomType}
                  onChange={(e) => handleFilterChange('bathroomType', e.target.value)}
                  className="form-control"
                >
                  <option value="">All Bathroom Types</option>
                  <option value="ATTACHED">Attached</option>
                  <option value="COMMON">Common</option>
                </select>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => setFilters({ roomType: '', bathroomType: '' })}
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {checkInDate && checkOutDate && (
            <div className="search-info">
              <p><strong>Duration:</strong> {getDaysDifference()} day(s)</p>
              <p><strong>Period:</strong> {formatDate(checkInDate)} to {formatDate(checkOutDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Rooms Section */}
      <div className="rooms-section">
        <div className="container">
          <div className="rooms-header">
            <h2>Available Rooms</h2>
            {(() => {
              const roomsToShow = availableRooms.length > 0 ? availableRooms : rooms;
              const filteredRooms = filterRooms(roomsToShow);
              const totalRooms = roomsToShow.length;
              const filteredCount = filteredRooms.length;
              
              if (totalRooms !== filteredCount) {
                return (
                  <div className="filter-summary">
                    Showing {filteredCount} of {totalRooms} rooms
                    {(filters.roomType || filters.bathroomType) && (
                      <span className="active-filters">
                        {' '}(filtered by {[filters.roomType, filters.bathroomType].filter(Boolean).join(', ')})
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>
          
          {(() => {
            const roomsToShow = availableRooms.length > 0 ? availableRooms : rooms;
            const filteredRooms = filterRooms(roomsToShow);
            
            if (filteredRooms.length === 0) {
              return (
                <div className="no-rooms">
                  <p>
                    {availableRooms.length === 0 && (checkInDate && checkOutDate) 
                      ? "No rooms available for the selected dates. Please try different dates."
                      : "No rooms match your current filters. Please adjust your filters or clear them to see all rooms."
                    }
                  </p>
                </div>
              );
            }
            
            return (
              <div className="rooms-grid">
                {filteredRooms.map(room => (
                <div key={room.id} className="room-card">
                  <div className="room-image">
                    <div className="room-type-badge">{room.roomType}</div>
                  </div>
                  
                  <div className="room-content">
                    <h3>Room {room.roomNumber}</h3>
                    <div className="room-features">
                      <span className="feature">🛏️ {room.roomType}</span>
                      <span className="feature">🚿 {room.bathroomType}</span>
                    </div>
                    
                    <div className="room-pricing">
                      <div className="price-item">
                        <span className="price-label">Daily Rate:</span>
                        <span className="price-value">₹{room.dailyReferenceCost || 0}</span>
                      </div>
                      <div className="price-item">
                        <span className="price-label">Monthly Rate:</span>
                        <span className="price-value">₹{room.monthlyReferenceCost || 0}</span>
                      </div>
                    </div>
                    
                    <div className="room-actions">
                      <button 
                        className="btn btn-primary book-now-btn"
                        onClick={() => handleBookRoom(room)}
                        disabled={!checkInDate || !checkOutDate}
                      >
                        {!checkInDate || !checkOutDate ? 'Select Dates First' : 'Book Now'}
                      </button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Booking Success Message */}
      {showBookingSuccess && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-icon">✅</div>
            <h3>Booking Request Sent!</h3>
            <p>Your booking request has been submitted successfully. We will contact you soon to confirm your reservation.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowBookingSuccess(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal booking-modal">
            <div className="modal-header">
              <h3>Book Room {selectedRoom?.roomNumber}</h3>
              <button className="modal-close" onClick={() => setShowBookingModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="modal-body">
              <div className="booking-summary">
                <h4>Booking Details</h4>
                <p><strong>Room:</strong> {selectedRoom?.roomNumber} ({selectedRoom?.roomType})</p>
                <p><strong>Check-in:</strong> {formatDate(bookingData.checkInDate)}</p>
                <p><strong>Check-out:</strong> {formatDate(bookingData.checkOutDate)}</p>
                <p><strong>Duration:</strong> {getDaysDifference()} day(s)</p>
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={bookingData.customerName}
                  onChange={(e) => setBookingData({...bookingData, customerName: e.target.value})}
                  required
                  className="form-control"
                  disabled={customer} // Disable if logged in
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={bookingData.customerPhone}
                  onChange={(e) => setBookingData({...bookingData, customerPhone: e.target.value})}
                  required
                  className="form-control"
                  disabled={customer} // Disable if logged in
                />
              </div>


              <div className="form-group">
                <label>Booking Type</label>
                <select
                  value={bookingData.bookingDurationType}
                  onChange={(e) => handleBookingTypeChange(e.target.value)}
                  className="form-control"
                >
                  <option value="DAILY">Daily</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>


              <div className="cost-breakdown">
                <h4>Cost Breakdown</h4>
                <div className="breakdown-item">
                  <span>
                    {bookingData.bookingDurationType === 'DAILY' 
                      ? `Daily Rate (${getDaysDifference()} days):` 
                      : 'Monthly Rate:'
                    }
                  </span>
                  <span>₹{calculateTotalCost(selectedRoom, bookingData.bookingDurationType, getDaysDifference())}</span>
                </div>
                <div className="breakdown-item total">
                  <span><strong>Total Amount:</strong></span>
                  <span><strong>₹{bookingData.totalAmount}</strong></span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Booking Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicRoomView;
