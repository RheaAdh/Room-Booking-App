import React, { useState } from 'react';
import api from '../config/api';
import './Dashboard.css';

const RoomAvailabilityScreen = () => {
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

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
      // Convert dates to ISO format with time
      const checkInDateTime = new Date(checkInDate + 'T10:00:00').toISOString();
      const checkOutDateTime = new Date(checkOutDate + 'T10:00:00').toISOString();
      
      const response = await api.get('/rooms/check-availability', {
        params: {
          checkInDate: checkInDateTime,
          checkOutDate: checkOutDateTime
        }
      });
      setAvailableRooms(response.data);
    } catch (error) {
      console.error('Error checking room availability:', error);
      alert('Failed to check room availability');
    } finally {
      setCheckingAvailability(false);
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

  return (
    <div className="room-availability-screen">
      <div className="page-header">
        <h1>🏠 Room Availability Checker</h1>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Check Room Availability</h3>
        </div>
        <div className="card-body">
          <div className="availability-form">
            <div className="form-group">
              <label htmlFor="checkInDate">Check-in Date</label>
              <input
                type="date"
                id="checkInDate"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="checkOutDate">Check-out Date</label>
              <input
                type="date"
                id="checkOutDate"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate}
                className="form-control"
              />
            </div>

            <button
              onClick={checkRoomAvailability}
              disabled={checkingAvailability || !checkInDate || !checkOutDate}
              className="btn btn-primary"
            >
              {checkingAvailability ? '🔍 Checking...' : '🔍 Check Availability'}
            </button>
          </div>

          {checkInDate && checkOutDate && (
            <div className="booking-info">
              <p><strong>Duration:</strong> {getDaysDifference()} day(s)</p>
              <p><strong>Period:</strong> {formatDate(checkInDate)} to {formatDate(checkOutDate)}</p>
            </div>
          )}

          {availableRooms.length > 0 && (
            <div className="available-rooms">
              <h4>✅ Available Rooms ({availableRooms.length})</h4>
              <div className="rooms-grid">
                {availableRooms.map((room) => (
                  <div key={room.roomNumber} className="room-card available">
                    <div className="room-header">
                      <h5>Room {room.roomNumber}</h5>
                      <span className="room-type">{room.roomType}</span>
                    </div>
                    <div className="room-details">
                      <div className="room-info">
                        <span className="info-item">
                          <strong>Bathroom:</strong> {room.bathroomType}
                        </span>
                        <span className="info-item">
                          <strong>Daily Rate:</strong> ₹{room.dailyReferenceCost || 0}
                        </span>
                        <span className="info-item">
                          <strong>Monthly Rate:</strong> ₹{room.monthlyReferenceCost || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableRooms.length === 0 && checkInDate && checkOutDate && !checkingAvailability && (
            <div className="no-rooms-available">
              <div className="no-rooms-icon">🚫</div>
              <h4>No Rooms Available</h4>
              <p>Sorry, no rooms are available for the selected dates.</p>
              <p>Please try different dates or contact for assistance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomAvailabilityScreen;
