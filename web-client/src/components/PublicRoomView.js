import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import { toLocalDateTimeString } from '../utils/dateUtils';
import './PublicRoomView.css';

const PublicRoomView = ({ onShowAuth, customer, onBookingRequestSubmitted }) => {
  const [rooms, setRooms] = useState([]);
  const [roomConfigurations, setRoomConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [filters, setFilters] = useState({
    numberOfPeople: ''
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerPhone: '',
    checkInDate: '',
    checkOutDate: '',
    numberOfPeople: 1,
    bookingDurationType: 'DAILY',
    dailyCost: '',
    monthlyCost: '',
    totalAmount: 0
  });

  const calculateTotalCost = useCallback((roomConfig, durationType, days) => {
    let baseCost = 0;
    if (durationType === 'DAILY' && roomConfig.dailyCost) {
      baseCost = roomConfig.dailyCost * days;
    } else if (durationType === 'MONTHLY' && roomConfig.monthlyCost) {
      baseCost = roomConfig.monthlyCost;
    } else if (roomConfig.dailyCost) {
      baseCost = roomConfig.dailyCost * days;
    }
    return baseCost;
  }, []);

  const handleBookRoom = useCallback((room, roomConfig) => {
    if (!checkInDate || !checkOutDate) {
      alert('Please select check-in and check-out dates first to proceed with booking');
      return;
    }
    
    // Check if user is logged in
    if (!customer) {
      // Store the room and dates for after login
      const bookingInfo = {
        room,
        roomConfig,
        checkInDate,
        checkOutDate
      };
      localStorage.setItem('pendingBooking', JSON.stringify(bookingInfo));
      onShowAuth();
      return;
    }
    
    // User is logged in, proceed with booking
    const days = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
    const totalCost = calculateTotalCost(roomConfig, 'DAILY', days);
    
    setSelectedRoom(room);
    setBookingData({
      customerName: customer.name,
      customerPhone: customer.phoneNumber,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      numberOfPeople: roomConfig.personCount,
      bookingDurationType: 'DAILY',
      dailyCost: roomConfig.dailyCost || 0,
      monthlyCost: roomConfig.monthlyCost || 0,
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
      const [roomsRes, roomConfigsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/room-configurations')
      ]);
      setRooms(roomsRes.data || []);
      setRoomConfigurations(roomConfigsRes.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
      setRoomConfigurations([]);
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

    if (!filters.numberOfPeople) {
      alert('Please select number of people');
      return;
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      alert('Check-out date must be after check-in date');
      return;
    }

    try {
      // Convert dates to ISO format with time (same as RoomAvailabilityScreen)
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

  // Function to get room image
  const getRoomImage = (roomId) => {
    // Available images: 1, 2, 3, 4, 5, 6, 8, 9, 10, 11 (missing 7)
    const availableImages = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11];
    const imageIndex = (roomId - 1) % availableImages.length;
    return `/rooms/${availableImages[imageIndex]}.jpg`;
  };

  // Calculate pricing based on dates and configuration
  const calculatePricing = (config, checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return null;
    
    const isMonthly = days > 30;
    const rate = isMonthly ? config.monthlyCost : config.dailyCost;
    const totalCost = isMonthly ? rate : rate * days;
    
    return {
      days,
      isMonthly,
      rate,
      totalCost,
      rateType: isMonthly ? 'month' : 'day'
    };
  };

  const filterRooms = (roomsToFilter) => {
    // Ensure roomsToFilter is an array before calling filter
    if (!Array.isArray(roomsToFilter)) {
      return [];
    }
    return roomsToFilter.filter(room => {
      // Filter by number of people - check if room can accommodate the requested number
      if (filters.numberOfPeople) {
        const requestedPeople = parseInt(filters.numberOfPeople);
        // Check if any room configuration can accommodate this many people
        const roomConfigs = roomConfigurations.filter(config => config.roomId === room.id);
        const canAccommodate = roomConfigs.some(config => config.personCount >= requestedPeople);
        return canAccommodate;
      }
      return true;
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


      {/* Airbnb-style Search Section */}
      <div className="airbnb-search-section">
        <div className="container">
          <div className="search-header">
            <h2>Find your perfect stay</h2>
            <p>Search and filter rooms based on your preferences</p>
          </div>
          
          <div className="search-filters">
            <div className="filter-group">
              <label className="filter-label">Check-in</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="filter-input"
                placeholder="Add dates"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Check-out</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate}
                className="filter-input"
                placeholder="Add dates"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Guests</label>
              <select
                value={filters.numberOfPeople}
                onChange={(e) => handleFilterChange('numberOfPeople', e.target.value)}
                className="filter-input"
              >
                <option value="">How many guests?</option>
                <option value="1">1 guest</option>
                <option value="2">2 guests</option>
                <option value="3">3 guests</option>
                <option value="4">4 guests</option>
                <option value="5">5 guests</option>
                <option value="6">6 guests</option>
                <option value="7">7 guests</option>
                <option value="8">8 guests</option>
              </select>
            </div>
            
            <div className="filter-actions">
              <button 
                className="search-btn"
                onClick={checkAvailability}
                disabled={!checkInDate || !checkOutDate || !filters.numberOfPeople}
              >
                <span className="search-icon">🔍</span>
                Search
              </button>
              {availableRooms.length > 0 && (
                <button 
                  className="clear-btn"
                  onClick={() => setAvailableRooms([])}
                >
                  Show All
                </button>
              )}
            </div>
          </div>
          
          
        </div>
      </div>

      {/* Rooms Section */}
      <div className="rooms-section">
        <div className="container">
          <div className="rooms-header">
            <h2>{availableRooms.length > 0 ? 'Available Rooms' : 'All Rooms'}</h2>
            {(() => {
              const roomsToShow = availableRooms.length > 0 ? availableRooms : rooms;
              const filteredRooms = filterRooms(roomsToShow || []);
              const totalRooms = (roomsToShow || []).length;
              const filteredCount = filteredRooms.length;
              
              if (availableRooms.length > 0) {
                return (
                  <div className="availability-info">
                    <p>Showing rooms available for {filters.numberOfPeople} people from {formatDate(checkInDate)} to {formatDate(checkOutDate)}</p>
                  </div>
                );
              }
              
              if (totalRooms !== filteredCount) {
                return (
                  <div className="filter-summary">
                    Showing {filteredCount} of {totalRooms} rooms
                    {filters.numberOfPeople && (
                      <span className="active-filters">
                        {' '}(filtered by {filters.numberOfPeople} people)
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
            const filteredRooms = filterRooms(roomsToShow || []);
            
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
                {filteredRooms.map(room => {
                  const roomConfigs = roomConfigurations.filter(config => config.roomId === room.id);
                  return (
                    <div key={room.id} className="room-card">
                      <div className="room-image">
                        <img 
                          src={getRoomImage(room.id)} 
                          alt={`Room ${room.roomNumber}`}
                          className="room-photo"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
                          }}
                        />
                        <div className="room-badges">
                          <span className="badge wifi">Free WiFi</span>
                        </div>
                      </div>
                      
                      <div className="room-content">
                        <div className="room-header">
                          <h3>Room {room.roomNumber}</h3>
                  
      
                        
                        <div className="room-features">
                          <span className="feature">🚿 {room.bathroomType}</span>
                        </div>
                        
                        </div>  
                        <div className="room-configurations">
                          
                          {roomConfigs.map(config => (
                            <div key={config.id} className="config-option">
                              <div className="config-info">
                                <span className="person-count">{config.personCount} {config.personCount === 1 ? 'Person' : 'People'}</span>
                                <div className="config-pricing">
                                  <span className="daily-rate">₹{config.dailyCost}/day</span>
                                  <span className="monthly-rate">₹{config.monthlyCost}/month</span>
                                </div>
                              </div>
                              <div className="config-actions">
                                {(() => {
                                  const pricing = calculatePricing(config, checkInDate, checkOutDate);
                                  return (
                                    <button 
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleBookRoom(room, config)}
                                      disabled={!checkInDate || !checkOutDate}
                                    >
                                      {!checkInDate || !checkOutDate 
                                        ? 'Select Dates First' 
                                        : pricing 
                                          ? `Book Now - ₹${pricing.totalCost} (${pricing.days} ${pricing.rateType}${pricing.days > 1 ? 's' : ''})`
                                          : 'Book Now'
                                      }
                                    </button>
                                  );
                                })()}
                           
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
            <div style={{ textAlign: 'left', margin: '20px 0' }}>
              <p><strong>To confirm your booking, please make a token payment of ₹500 to:</strong></p>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px', 
                margin: '10px 0',
                border: '1px solid #e9ecef'
              }}>
                <p style={{ margin: '5px 0', fontSize: '16px' }}>📱 <strong>Google Pay: 9731177065</strong></p>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                  After payment, your booking will be confirmed and you'll receive a confirmation message.
                </p>
              </div>
            </div>
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
                <p><strong>Room:</strong> {selectedRoom?.roomNumber}</p>
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
