import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../config/api';
import './CustomerDashboard.css';

// Create customer-specific API instance
const createCustomerApi = () => {
  return axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8082/api/v1',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('customerToken')}`
    }
  });
};

const CustomerDashboard = ({ customer, onLogout, onShowRooms, refreshTrigger }) => {
  const [bookings, setBookings] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomConfigurations, setRoomConfigurations] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchDates, setSearchDates] = useState({
    checkIn: '',
    checkOut: ''
  });
  const [searchFilters, setSearchFilters] = useState({
    guests: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [error, setError] = useState(null);

  // Fetch rooms and configurations
  const fetchRoomsData = useCallback(async () => {
    try {
      const [roomsResponse, configsResponse] = await Promise.all([
        api.get('/rooms'),
        api.get('/room-configurations')
      ]);
      
      setRooms(roomsResponse.data || []);
      setRoomConfigurations(configsResponse.data || []);
      setFilteredRooms(roomsResponse.data || []);
    } catch (error) {
      console.error('Error fetching rooms data:', error);
    }
  }, []);

  const fetchCustomerData = useCallback(async () => {
    if (!customer || !customer.phoneNumber) {
      console.log('Customer or phoneNumber not available:', customer);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('customerToken');
    if (!token) {
      console.log('No customer token found, redirecting to login...');
      if (onLogout) {
        onLogout();
      }
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      console.log('Fetching data for customer:', customer.phoneNumber);
      console.log('Current token:', localStorage.getItem('customerToken'));
      console.log('Customer data:', customer);
      
      // Fetch bookings - try direct fetch first
      console.log('Trying direct fetch request...');
      const directResponse = await fetch('http://localhost:8082/api/v1/customer/bookings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Direct fetch response status:', directResponse.status);
      console.log('Direct fetch response headers:', directResponse.headers);
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('Direct fetch data:', directData);
        setBookings(directData || []);
      } else {
        console.log('Direct fetch failed, trying axios...');
        const customerApi = createCustomerApi();
        const bookingsResponse = await customerApi.get('/customer/bookings');
        console.log('Bookings fetched:', bookingsResponse.data);
        setBookings(bookingsResponse.data || []);
      }

      // Fetch booking requests
      const customerApi = createCustomerApi();
      const requestsResponse = await customerApi.get(`/booking-requests/customer/${customer.phoneNumber}`);
      console.log('Booking requests fetched:', requestsResponse.data);
      setBookingRequests(requestsResponse.data || []);
      
    } catch (error) {
      console.error('Error fetching customer data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Only clear auth for actual auth errors
      if (error.response?.status === 401) {
        console.log('Authentication error, clearing localStorage...');
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerData');
        if (onLogout) {
          onLogout();
        }
      } else {
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           `Unable to load data (${error.response?.status || 'Network Error'}). Please try again.`;
        setError(errorMessage);
        setBookings([]);
        setBookingRequests([]);
      }
    } finally {
      setLoading(false);
    }
  }, [customer, onLogout]);

  // Helper functions
  const getDaysDifference = useCallback(() => {
    if (!searchDates.checkIn || !searchDates.checkOut) return 0;
    const checkIn = new Date(searchDates.checkIn);
    const checkOut = new Date(searchDates.checkOut);
    const diffTime = Math.abs(checkOut - checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [searchDates]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Calculate pricing based on dates and configuration
  const calculatePricing = useCallback((config, checkIn, checkOut) => {
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
  }, []);

  // Function to get room image
  const getRoomImage = (roomId) => {
    // Available images: 1, 2, 3, 4, 5, 6, 8, 9, 10, 11 (missing 7)
    const availableImages = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11];
    const imageIndex = (roomId - 1) % availableImages.length;
    return `/rooms/${availableImages[imageIndex]}.jpg`;
  };

  // Function to check room availability (same format as PublicRoomView)
  const checkRoomAvailability = useCallback(async (checkIn, checkOut) => {
    try {
      const checkInDateTime = new Date(checkIn + 'T10:00:00').toISOString();
      const checkOutDateTime = new Date(checkOut + 'T10:00:00').toISOString();
      
      // Use public API for room availability check
      const publicApi = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8082/api/v1',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const response = await publicApi.get('/rooms/check-availability', {
        params: {
          checkInDate: checkInDateTime,
          checkOutDate: checkOutDateTime
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error checking availability:', error);
      return [];
    }
  }, []);

  // Search and booking functions
  const handleSearchRooms = useCallback(async () => {
    if (!searchDates.checkIn || !searchDates.checkOut || !searchFilters.guests) {
      return;
    }

    // Filter rooms by availability and guest count
    const availableRooms = await checkRoomAvailability(searchDates.checkIn, searchDates.checkOut);
    const filteredByGuests = availableRooms.filter(room => {
      const roomConfigs = roomConfigurations.filter(config => config.roomId === room.id);
      return roomConfigs.some(config => config.personCount >= parseInt(searchFilters.guests));
    });
    
    setFilteredRooms(filteredByGuests);
  }, [searchDates, searchFilters, roomConfigurations, checkRoomAvailability]);

  const handleClearSearch = useCallback(() => {
    setSearchDates({ checkIn: '', checkOut: '' });
    setSearchFilters({ guests: '' });
    setFilteredRooms(rooms);
  }, [rooms]);

  const [showBookingPreview, setShowBookingPreview] = useState(false);
  const [previewBooking, setPreviewBooking] = useState(null);

  const handleBookRoom = useCallback((room, config) => {
    if (!searchDates.checkIn || !searchDates.checkOut) {
      alert('Please select check-in and check-out dates first');
      return;
    }

    // Create booking preview data
    const bookingData = {
      customerName: customer.name,
      customerPhone: customer.phoneNumber,
      checkInDate: new Date(searchDates.checkIn).toISOString(),
      checkOutDate: new Date(searchDates.checkOut).toISOString(),
      numberOfPeople: parseInt(searchFilters.guests),
      bookingDurationType: 'DAILY',
      roomId: room.id,
      roomNumber: room.roomNumber,
      dailyCost: config.dailyCost,
      monthlyCost: config.monthlyCost,
      totalAmount: config.dailyCost * getDaysDifference(),
      days: getDaysDifference()
    };

    // Show preview modal
    setPreviewBooking(bookingData);
    setShowBookingPreview(true);
  }, [searchDates, searchFilters, customer, getDaysDifference]);

  const confirmBooking = useCallback(async () => {
    if (!previewBooking) return;

    try {
      // Create API instance without authentication for public endpoint
      const publicApi = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8082/api/v1',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await publicApi.post('/booking-requests', previewBooking);

      if (response.data.success) {
        // Show payment confirmation message
        const paymentMessage = `
🎉 Booking Request Submitted Successfully!

To confirm your booking, please make a token payment of ₹500 to:
📱 Google Pay: 9731177065

After payment, your booking will be confirmed and you'll receive a confirmation message.

Booking ID: ${response.data.id || 'N/A'}
        `;
        
        alert(paymentMessage);
        fetchCustomerData(); // Refresh data
        handleClearSearch(); // Clear search
        setShowBookingPreview(false);
        setPreviewBooking(null);
      } else {
        alert('Failed to submit booking request: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error submitting booking request:', error);
      alert('Error submitting booking request. Please try again.');
    }
  }, [previewBooking, fetchCustomerData, handleClearSearch]);


  useEffect(() => {
    fetchCustomerData();
    fetchRoomsData();
  }, [fetchCustomerData, fetchRoomsData]);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      console.log('Refresh trigger detected, refetching customer data...');
      fetchCustomerData();
    }
  }, [refreshTrigger, fetchCustomerData]);

  const previewInvoice = async (bookingId) => {
    try {
      console.log('Previewing invoice for booking:', bookingId);
      console.log('Current token:', localStorage.getItem('customerToken'));
      
      const customerApi = createCustomerApi();
      const response = await customerApi.get(`/invoices/${bookingId}/preview`);
      
      console.log('Invoice preview response:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataLength: response.data?.length || 'unknown'
      });
      
      if (response.data) {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(response.data);
        newWindow.document.close();
        console.log('Invoice preview opened successfully');
      } else {
        console.error('Empty preview response');
        alert('Invoice preview is empty. Please try again.');
      }
    } catch (error) {
      console.error('Error previewing invoice:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      alert(`Failed to preview invoice: ${error.message}. Please try again.`);
    }
  };

  const downloadInvoice = async (bookingId) => {
    try {
      console.log('Downloading invoice for booking:', bookingId);
      console.log('Current token:', localStorage.getItem('customerToken'));
      
      // Get the HTML preview content and download it as HTML
      const customerApi = createCustomerApi();
      const response = await customerApi.get(`/invoices/${bookingId}/preview`);
      
      console.log('Invoice preview response:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataLength: response.data?.length || 'unknown'
      });
      
      if (response.data) {
        // Create a blob with the HTML content
        const blob = new Blob([response.data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${bookingId}.html`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        console.log('Invoice download completed successfully');
      } else {
        console.error('Empty preview response');
        alert('Invoice content is empty. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      alert(`Error downloading invoice: ${error.message}. Please try again.`);
    }
  };


  const calculatePaymentBreakdown = (booking) => {
    const totalAmount = parseFloat(booking.totalAmount) || 0;
    const payments = booking.payments || [];
    const totalPaid = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
    const dueAmount = totalAmount - totalPaid;
    
    return {
      totalAmount,
      totalPaid,
      dueAmount,
      paymentCount: payments.length
    };
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'NEW': { text: 'New', class: 'status-new' },
      'PENDING': { text: 'Pending', class: 'status-pending' },
      'CONFIRMED': { text: 'Confirmed', class: 'status-confirmed' },
      'CANCELLED': { text: 'Cancelled', class: 'status-cancelled' },
      'CHECKEDOUT': { text: 'Checked Out', class: 'status-checkedout' },
      'CHECKEDIN': { text: 'Checked In', class: 'status-checkedin' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getRequestStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { text: 'Pending', class: 'status-pending' },
      'APPROVED': { text: 'Approved', class: 'status-confirmed' },
      'REJECTED': { text: 'Rejected', class: 'status-cancelled' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };


  if (loading || !customer) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="booking-dashboard">
      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button 
                className="retry-btn"
                onClick={() => fetchCustomerData()}
              >
                🔄 Retry
              </button>
          </div>
        </div>
      )}
      {/* Main Content */}
      <div className="main-content">
        <div className="content-container">
          {/* Booking.com Style Tab Navigation */}
          <nav className="booking-tabs">
            <div className="tab-container">
              <button 
                className={`booking-tab ${activeTab === 'rooms' ? 'active' : ''}`}
                onClick={() => setActiveTab('rooms')}
              >
                <span className="tab-icon">🏠</span>
                <span className="tab-text">Browse Rooms</span>
              </button>
              <button 
                className={`booking-tab ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                <span className="tab-icon">📋</span>
                <span className="tab-text">My Bookings</span>
                {bookings.length > 0 && <span className="tab-badge">{bookings.length}</span>}
              </button>
              <button 
                className={`booking-tab ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <span className="tab-icon">📨</span>
                <span className="tab-text">My Requests</span>
                {bookingRequests.length > 0 && <span className="tab-badge">{bookingRequests.length}</span>}
              </button>
              <button 
                className={`booking-tab ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
              >
                <span className="tab-icon">ℹ️</span>
                <span className="tab-text">About</span>
              </button>
            </div>
          </nav>

          {/* Browse Rooms Tab */}
          {activeTab === 'rooms' && (
            <div className="booking-content">

              
              {/* Search Section */}
              <div className="search-section">
                <div className="search-filters">
                  <div className="filter-group">
                    <label className="filter-label">Check-in</label>
                    <input
                      type="date"
                      value={searchDates.checkIn}
                      onChange={(e) => setSearchDates(prev => ({ ...prev, checkIn: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="filter-input"
                      placeholder="Add dates"
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label className="filter-label">Check-out</label>
                    <input
                      type="date"
                      value={searchDates.checkOut}
                      onChange={(e) => setSearchDates(prev => ({ ...prev, checkOut: e.target.value }))}
                      min={searchDates.checkIn}
                      className="filter-input"
                      placeholder="Add dates"
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label className="filter-label">Guests</label>
                    <select
                      value={searchFilters.guests}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, guests: e.target.value }))}
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
                      onClick={handleSearchRooms}
                      disabled={!searchDates.checkIn || !searchDates.checkOut || !searchFilters.guests}
                    >
                      <span className="search-icon">🔍</span>
                      Search
                    </button>
                    <button 
                      className="clear-btn"
                      onClick={handleClearSearch}
                    >
                      Show All
                    </button>
              </div>
            </div>

              </div>

              {/* Rooms Grid */}
              <div className="rooms-section">
                <div className="rooms-header">
                  <h2>{filteredRooms.length > 0 ? 'Available Rooms' : 'All Rooms'}</h2>
                  <p>{filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} found</p>
                </div>
                
                {filteredRooms.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-illustration">
                      <div className="empty-icon">🏨</div>
                    </div>
                    <h3>No rooms available</h3>
                    <p>No rooms match your current search criteria. Try adjusting your filters or dates.</p>
                  </div>
                ) : (
                  <div className="rooms-grid">
                    {filteredRooms.map(room => (
                      <div key={room.id} className="room-card">
                        <div className="room-image">
                          <img 
                            src={getRoomImage(room.id)} 
                            alt={`Room ${room.roomNumber}`}
                            className="room-photo"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="room-badges">
                            <span className="badge wifi">Free WiFi</span>
                          </div>
                        </div>
                        
                        <div className="room-content">
                          <div className="room-header">
                            <h3>Room {room.roomNumber}</h3>
                            <div className="room-rating">
                              <span className="stars">★★★★☆</span>
                              <span className="rating-score">4.2</span>
                            </div>
                          </div>
                          
                          <div className="room-configurations">
                            {roomConfigurations.filter(config => config.roomId === room.id).map(config => (
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
                                    const pricing = calculatePricing(config, searchDates.checkIn, searchDates.checkOut);
                                    return (
                                      <button 
                                        className="booking-btn primary"
                                        onClick={() => handleBookRoom(room, config)}
                                        disabled={!searchDates.checkIn || !searchDates.checkOut}
                                      >
                                        {!searchDates.checkIn || !searchDates.checkOut 
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="booking-content">

              
              {bookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-illustration">
                  <div className="empty-icon">📅</div>
                    <div className="empty-decoration"></div>
                  </div>
                  <h3>No bookings yet</h3>
                  <p>You don't have any confirmed bookings yet. Start by browsing our rooms!</p>
                  <button className="booking-btn primary" onClick={onShowRooms}>
                    <span className="btn-icon">🏠</span>
                    Browse Available Rooms
                  </button>
                </div>
              ) : (
                <div className="booking-grid">
                  {bookings.map(booking => {
                    const breakdown = calculatePaymentBreakdown(booking);
                    return (
                    <div key={booking.id} className="booking-card">
                        <div className="card-image">
                          <div className="room-number">Room {booking.roomId}</div>
                          <div className="status-badge">{getStatusBadge(booking.bookingStatus)}</div>
                        </div>
                        
                        <div className="card-content">
                          <div className="card-title">
                            <h3>Booking #{booking.id}</h3>
                            <div className="price">₹{breakdown.totalAmount.toFixed(2)}</div>
                          </div>
                          
                          <div className="card-details">
                        <div className="detail-row">
                          <span className="label">Check-in:</span>
                          <span className="value">{formatDate(booking.checkInDate)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Check-out:</span>
                          <span className="value">{formatDate(booking.checkOutDate)}</span>
                        </div>
                            <div className="detail-row">
                              <span className="label">Guests:</span>
                              <span className="value">{booking.numberOfPeople}</span>
                            </div>
                        <div className="detail-row">
                          <span className="label">Duration:</span>
                          <span className="value">{booking.bookingDurationType}</span>
                        </div>
                              </div>
                          
                          <div className="payment-info">
                            <div className="payment-row">
                              <span>Paid: ₹{breakdown.totalPaid.toFixed(2)}</span>
                              <span className={`due ${breakdown.dueAmount > 0 ? 'pending' : 'paid'}`}>
                                {breakdown.dueAmount > 0 ? `Due: ₹${breakdown.dueAmount.toFixed(2)}` : 'Fully Paid'}
                                </span>
                              </div>
                              </div>
                      </div>
                      
                        <div className="card-actions">
                        <button
                            className="booking-btn secondary"
                          onClick={() => previewInvoice(booking.id)}
                        >
                            Preview Invoice
                        </button>
                        <button
                            className="booking-btn primary"
                          onClick={() => downloadInvoice(booking.id)}
                        >
                            Download
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="booking-content">
              {bookingRequests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-illustration">
                  <div className="empty-icon">📋</div>
                    <div className="empty-decoration"></div>
                  </div>
                  <h3>No booking requests yet</h3>
                  <p>You haven't submitted any booking requests yet. Start by browsing our rooms!</p>
                  <button className="btn-primary" onClick={onShowRooms}>
                    <span className="btn-icon">🏠</span>
                    Browse Available Rooms
                  </button>
                </div>
              ) : (
                <div className="booking-grid">
                  {bookingRequests.map(request => (
                    <div key={request.id} className="booking-card">
                      <div className="card-image">
                        <div className="room-number">Room {request.roomId}</div>
                        <div className="status-badge">{getRequestStatusBadge(request.status)}</div>
                      </div>
                      
                      <div className="card-content">
                        <div className="card-title">
                          <h3>Request #{request.id}</h3>
                          <div className="price">₹{request.totalAmount}</div>
                        </div>
                        
                        <div className="card-details">
                        <div className="detail-row">
                          <span className="label">Check-in:</span>
                          <span className="value">{formatDate(request.checkInDate)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Check-out:</span>
                          <span className="value">{formatDate(request.checkOutDate)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Duration:</span>
                          <span className="value">{request.bookingDurationType}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Submitted:</span>
                          <span className="value">{formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                        
                        {request.remarks && (
                          <div className="payment-info">
                            <div className="payment-row">
                              <span><strong>Remarks:</strong> {request.remarks}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="booking-content">
              <div className="property-info-section">
                <div className="property-header">
                  <h2>Professionals Pride PG</h2>
                  <div className="property-rating">
                    <span className="stars">★★★★★</span>
                    <span className="rating-text">4.5/5 • Excellent location</span>
                  </div>
                </div>
                
                <div className="property-highlights">
                  <div className="highlight-category">
                    <h3>🏆 Most Popular Facilities</h3>
                    <div className="facilities-grid">
                      <span className="facility">✓ Free WiFi (12 Mbps)</span>
                      <span className="facility">✓ Family rooms</span>
                      <span className="facility">✓ Private parking</span>
                      <span className="facility">✓ Non-smoking rooms</span>
                      <span className="facility">✓ 24-hour front desk</span>
                      <span className="facility">✓ Shared kitchen</span>
                      <span className="facility">✓ Terrace</span>
                      <span className="facility">✓ Lockers</span>
                    </div>
                  </div>
                  
                  <div className="highlight-category">
                    <h3>🚗 Parking Options</h3>
                    <div className="parking-options">
                      <div className="parking-option">
                        <span className="parking-type">Private parking</span>
                        <span className="parking-price">₹50 per day</span>
                      </div>
                      <div className="parking-option">
                        <span className="parking-type">Free public parking</span>
                        <span className="parking-price">Free</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="highlight-category">
                    <h3>🕐 Check-in/Check-out</h3>
                    <div className="checkin-info">
                      <div className="time-info">
                        <span className="time-label">Check-in:</span>
                        <span className="time-value">10:00 - 23:30</span>
                      </div>
                      <div className="time-info">
                        <span className="time-label">Check-out:</span>
                        <span className="time-value">01:00 - 10:00</span>
                      </div>
                      <div className="time-note">
                        <small>Photo ID and credit card required at check-in</small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="highlight-category">
                    <h3>📍 What's Nearby</h3>
                    <div className="nearby-places">
                      <div className="nearby-item">
                        <span className="place-name">Reserved Forest Mixed Plantation</span>
                        <span className="place-distance">500m</span>
                      </div>
                      <div className="nearby-item">
                        <span className="place-name">Children Play Park</span>
                        <span className="place-distance">1.1km</span>
                      </div>
                      <div className="nearby-item">
                        <span className="place-name">Whitefield Railway Station</span>
                        <span className="place-distance">4.1km</span>
                      </div>
                      <div className="nearby-item">
                        <span className="place-name">Kempegowda International Airport</span>
                        <span className="place-distance">38km</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="highlight-category">
                    <h3>📋 House Rules</h3>
                    <div className="house-rules">
                      <div className="rule-item">
                        <span className="rule-icon">👶</span>
                        <span className="rule-text">Children 6+ years welcome, 18+ charged as adults</span>
                      </div>
                      <div className="rule-item">
                        <span className="rule-icon">🚫</span>
                        <span className="rule-text">No pets allowed</span>
                      </div>
                      <div className="rule-item">
                        <span className="rule-icon">🔇</span>
                        <span className="rule-text">Quiet hours: 21:00 - 06:00</span>
                      </div>
                      <div className="rule-item">
                        <span className="rule-icon">🎉</span>
                        <span className="rule-text">No parties/events allowed</span>
                      </div>
                      <div className="rule-item">
                        <span className="rule-icon">🆔</span>
                        <span className="rule-text">Photo ID required at check-in</span>
                      </div>
                      <div className="rule-item">
                        <span className="rule-icon">💳</span>
                        <span className="rule-text">Payment before arrival via bank transfer</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="highlight-category">
                    <h3>💰 Extra Charges</h3>
                    <div className="extra-charges">
                      <div className="charge-item">
                        <span className="charge-type">Extra bed (6+ years)</span>
                        <span className="charge-price">₹200 per person/night</span>
                      </div>
                      <div className="charge-item">
                        <span className="charge-type">Luggage storage</span>
                        <span className="charge-price">Additional charge</span>
                      </div>
                      <div className="charge-item">
                        <span className="charge-type">Private parking</span>
                        <span className="charge-price">₹50 per day</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Booking Preview Modal */}
      {showBookingPreview && previewBooking && (
        <div className="booking-preview-modal">
          <div className="booking-preview-content">
            <div className="booking-preview-header">
              <h2>📋 Booking Preview</h2>
              <button 
                className="close-btn"
                onClick={() => setShowBookingPreview(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="booking-preview-body">
              <div className="preview-section">
                <h3>Room Details</h3>
                <div className="preview-row">
                  <span className="preview-label">Room:</span>
                  <span className="preview-value">Room {previewBooking.roomNumber}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Guests:</span>
                  <span className="preview-value">{previewBooking.numberOfPeople} person{previewBooking.numberOfPeople !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="preview-section">
                <h3>Dates</h3>
                <div className="preview-row">
                  <span className="preview-label">Check-in:</span>
                  <span className="preview-value">{formatDate(previewBooking.checkInDate)}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Check-out:</span>
                  <span className="preview-value">{formatDate(previewBooking.checkOutDate)}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Duration:</span>
                  <span className="preview-value">{previewBooking.days} night{previewBooking.days !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="preview-section">
                <h3>Cost Breakdown</h3>
                <div className="preview-row">
                  <span className="preview-label">Daily Rate:</span>
                  <span className="preview-value">₹{previewBooking.dailyCost}/night</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Total Nights:</span>
                  <span className="preview-value">{previewBooking.days} nights</span>
                </div>
                <div className="preview-row total-row">
                  <span className="preview-label"><strong>Total Amount:</strong></span>
                  <span className="preview-value"><strong>₹{previewBooking.totalAmount}</strong></span>
                </div>
              </div>

              <div className="preview-section">
                <h3>Customer Information</h3>
                <div className="preview-row">
                  <span className="preview-label">Name:</span>
                  <span className="preview-value">{previewBooking.customerName}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Phone:</span>
                  <span className="preview-value">{previewBooking.customerPhone}</span>
                </div>
              </div>
            </div>

            <div className="booking-preview-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowBookingPreview(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmBooking}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
