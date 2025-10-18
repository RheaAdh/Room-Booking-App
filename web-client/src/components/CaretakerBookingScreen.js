import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { toLocalDateTimeString, fromLocalDateTimeString, toLocalDateString } from '../utils/dateUtils';
import './CaretakerBookingScreen.css';

const CaretakerBookingScreen = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomConfigurations, setRoomConfigurations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'
  
  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    customerPhoneNumber: '',
    roomId: '',
    numberOfPeople: 1,
    checkInDate: new Date(),
    checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    bookingStatus: 'CONFIRMED',
    bookingDurationType: 'DAILY',
    dailyCost: '',
    monthlyCost: '',
    earlyCheckinCost: '',
    lateCheckoutCost: ''
  });
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    mode: '',
    createdAt: new Date(),
    paymentScreenshotUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, roomsRes, roomConfigsRes, customersRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/rooms'),
        api.get('/room-configurations'),
        api.get('/customer')
      ]);
      setBookings(bookingsRes.data);
      setRooms(roomsRes.data);
      setRoomConfigurations(roomConfigsRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value
      };
      
      // Auto-populate costs when room or number of people changes
      if (field === 'roomId' || field === 'numberOfPeople') {
        const roomConfig = getRoomConfiguration(newFormData.roomId, newFormData.numberOfPeople);
        console.log('Auto-populating costs:', {
          field,
          roomId: newFormData.roomId,
          numberOfPeople: newFormData.numberOfPeople,
          roomConfig
        });
        if (roomConfig) {
          newFormData.dailyCost = roomConfig.dailyCost;
          newFormData.monthlyCost = roomConfig.monthlyCost;
          console.log('Costs populated:', {
            dailyCost: newFormData.dailyCost,
            monthlyCost: newFormData.monthlyCost
          });
        }
      }
      
      return newFormData;
    });
  };

  const getRoomConfiguration = (roomId, numberOfPeople) => {
    return roomConfigurations.find(config => 
      config.roomId === parseInt(roomId) && config.personCount === parseInt(numberOfPeople)
    );
  };

  const calculateTotalCost = (formData) => {
    const checkInDate = new Date(formData.checkInDate);
    const checkOutDate = new Date(formData.checkOutDate);
    const earlyCheckinCost = parseFloat(formData.earlyCheckinCost) || 0;
    
    let totalCost = 0;
    
    if (formData.bookingDurationType === 'DAILY') {
      const dailyCost = parseFloat(formData.dailyCost) || 0;
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      totalCost = (dailyCost * daysDiff) + earlyCheckinCost;
    } else if (formData.bookingDurationType === 'MONTHLY') {
      const monthlyCost = parseFloat(formData.monthlyCost) || 0;
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const monthsDiff = Math.ceil(timeDiff / (1000 * 3600 * 24 * 30));
      totalCost = (monthlyCost * monthsDiff) + earlyCheckinCost;
    }
    
    return totalCost;
  };

  const validateBookingForm = (formData) => {
    if (formData.bookingDurationType === 'DAILY' && (!formData.dailyCost || parseFloat(formData.dailyCost) <= 0)) {
      alert('Please enter a valid daily cost for daily bookings.');
      return false;
    }
    if (formData.bookingDurationType === 'MONTHLY' && (!formData.monthlyCost || parseFloat(formData.monthlyCost) <= 0)) {
      alert('Please enter a valid monthly cost for monthly bookings.');
      return false;
    }
    return true;
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    
    if (!validateBookingForm(formData)) {
      return;
    }
    
    try {
      const totalCost = calculateTotalCost(formData);
      
      const bookingPayload = {
        ...formData,
        roomId: parseInt(formData.roomId),
        checkInDate: toLocalDateTimeString(formData.checkInDate),
        checkOutDate: toLocalDateTimeString(formData.checkOutDate),
        dailyCost: parseFloat(formData.dailyCost) || 0,
        monthlyCost: parseFloat(formData.monthlyCost) || 0,
        earlyCheckinCost: parseFloat(formData.earlyCheckinCost) || 0,
        totalAmount: totalCost
      };
      
      if (isEditing && selectedBooking) {
        await api.put(`/bookings/${selectedBooking.id}`, bookingPayload);
        alert('✅ Booking updated successfully!');
      } else {
        await api.post('/bookings', bookingPayload);
        alert(`✅ Booking created successfully! Total Amount: ₹${totalCost.toFixed(2)}`);
      }
      
      setShowBookingModal(false);
      setIsEditing(false);
      setSelectedBooking(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating/updating booking:', error);
      if (error.response?.status === 409) {
        setConflictMessage('Room is already booked for the selected dates. Please choose different dates or room.');
        setShowConflictModal(true);
      } else {
        alert('❌ Error creating/updating booking. Please try again.');
      }
    }
  };

  const handleEditBooking = (booking) => {
    // Ensure dates are valid, fallback to current date if invalid
    const checkInDate = fromLocalDateTimeString(booking.checkInDate) || new Date();
    const checkOutDate = fromLocalDateTimeString(booking.checkOutDate) || new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    setFormData({
      customerPhoneNumber: booking.customerPhoneNumber || '',
      roomId: booking.roomId || '',
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      bookingStatus: booking.bookingStatus,
      bookingDurationType: booking.bookingDurationType || 'DAILY',
      dailyCost: booking.dailyCost || '',
      monthlyCost: booking.monthlyCost || '',
      earlyCheckinCost: booking.earlyCheckinCost || '',
      lateCheckoutCost: booking.lateCheckoutCost || ''
    });
    setSelectedBooking(booking);
    setIsEditing(true);
    setShowBookingModal(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      // Convert date to proper format for backend
      const paymentDate = new Date(paymentData.createdAt);
      paymentDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      
      const paymentPayload = {
        bookingId: selectedBooking.id,
        amount: parseFloat(paymentData.amount) || 0,
        paymentMethod: paymentData.mode, // This should match PaymentMode enum values
        paymentScreenshotUrl: paymentData.paymentScreenshotUrl || '',
        paymentDate: toLocalDateTimeString(paymentDate) // Send as local datetime string, backend will parse it
      };
      
      if (isEditingPayment && editingPaymentId) {
        // Update existing payment
        await api.put(`/payments/${editingPaymentId}`, paymentPayload);
        alert('✅ Payment updated successfully!');
      } else {
        // Create new payment
        await api.post('/payments', paymentPayload);
        alert('✅ Payment added successfully!');
      }
      
      setShowPaymentModal(false);
      setIsEditingPayment(false);
      setEditingPaymentId(null);
      setPaymentData({ amount: '', mode: '', createdAt: new Date(), paymentScreenshotUrl: '' });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('❌ Error adding payment. Please try again.');
    }
  };

  const handleEditPayment = (payment) => {
    // Find the booking that contains this payment
    const booking = bookings.find(b => b.payments && b.payments.some(p => p.id === payment.id));
    if (booking) {
      setSelectedBooking(booking);
    }
    setIsEditingPayment(true);
    setEditingPaymentId(payment.id);
    setPaymentData({
      amount: payment.amount,
      mode: payment.mode,
      createdAt: new Date(payment.createdAt),
      paymentScreenshotUrl: payment.paymentScreenshotUrl || ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentScreenshotUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image (JPEG, PNG) or PDF file');
      return;
    }

    if (!selectedBooking || !selectedBooking.customerPhoneNumber) {
      alert('❌ No booking selected. Please select a booking first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/payments/upload-screenshot-new', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          phoneNumber: selectedBooking.customerPhoneNumber
        }
      });

      if (response.data.success) {
        setPaymentData(prev => ({
          ...prev,
          paymentScreenshotUrl: response.data.fileUrl
        }));
        alert('✅ Payment screenshot uploaded successfully!');
      } else {
        alert('❌ Error uploading payment screenshot: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error uploading payment screenshot:', error);
      alert('❌ Error uploading payment screenshot. Please try again.');
    }
  };

  const handleViewImage = (imageUrl, title) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageTitle(title);
    setShowImageModal(true);
  };

  const resetForm = () => {
    setFormData({
      customerPhoneNumber: '',
      roomId: '',
      checkInDate: new Date(),
      checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      bookingStatus: 'CONFIRMED',
      bookingDurationType: 'DAILY',
      dailyCost: '',
      monthlyCost: '',
      earlyCheckinCost: ''
    });
  };

  const handleCheckIn = async (bookingId) => {
    if (window.confirm('Are you sure you want to check-in this customer?')) {
      try {
        await api.patch(`/bookings/${bookingId}/checkin`);
        fetchData(); // Refresh data
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
        fetchData(); // Refresh data
        alert('Customer checked-out successfully!');
      } catch (error) {
        console.error('Error checking out:', error);
        alert('Error checking out customer. Please try again.');
      }
    }
  };

  const filteredBookings = bookings.filter(booking => {
    // Exclude CHECKEDOUT bookings
    if (booking.bookingStatus === 'CHECKEDOUT') return false;
    
    const searchLower = searchTerm.toLowerCase();
    // Find customer by phone number
    const customer = customers.find(c => c.phoneNumber === booking.customerPhoneNumber);
    // Find room by ID
    const room = rooms.find(r => r.id === booking.roomId);
    
    return (
      customer?.name?.toLowerCase().includes(searchLower) ||
      booking.customerPhoneNumber?.includes(searchTerm) ||
      room?.roomNumber?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return '#f39c12';
      case 'CONFIRMED': return '#27ae60';
      case 'CHECKED_IN': return '#3498db';
      case 'CHECKED_OUT': return '#95a5a6';
      case 'CANCELLED': return '#e74c3c';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="caretaker-loading">
        <div className="loading-spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="caretaker-booking">


      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 All Bookings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('add');
            resetForm();
            setIsEditing(false);
            setSelectedBooking(null);
            setShowBookingModal(true);
          }}
        >
          ➕ Add Booking
        </button>
      </div>

      {/* Search Bar */}
      {activeTab === 'list' && (
        
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, phone, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
   
      )}

      {/* Content */}
      <div className="booking-content">
        {activeTab === 'list' ? (
          <div className="bookings-list">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => {
                // Find customer and room data
                const customer = customers.find(c => c.phoneNumber === booking.customerPhoneNumber);
                const room = rooms.find(r => r.id === booking.roomId);
                
                return (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header-card">
                    <div className="booking-info">
                      <h3 className="customer-name">{customer?.name || 'Unknown Customer'}</h3>
                      <p className="customer-phone">{booking.customerPhoneNumber}</p>
                    </div>
                    <div className="booking-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(booking.bookingStatus) }}
                      >
                        {booking.bookingStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="booking-details">
                    <div className="detail-row">
                      <span className="detail-label">🏠 Room:</span>
                      <span className="detail-value">{room?.roomNumber || `Room ${booking.roomId}`}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📅 Dates:</span>
                      <span className="detail-value">
                        {new Date(booking.checkInDate).toLocaleDateString('en-IN')} - {new Date(booking.checkOutDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">💸 Due:</span>
                      <span className="detail-value">₹{booking.dueAmount}</span>
                    </div>
                  </div>

                  {/* Payments Section */}
                  {booking.payments && booking.payments.length > 0 && (
                    <div className="payments-section">
                      <h4>💳 Payments</h4>
                      <div className="payments-list">
                        {booking.payments.map((payment) => (
                          <div key={payment.id} className="payment-item">
                            <div className="payment-info">
                              <span className="payment-amount">₹{payment.amount}</span>
                              <span className="payment-mode">{payment.mode}</span>
                              <span className="payment-date">
                                {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                            <button 
                              className="edit-payment-btn"
                              onClick={() => handleEditPayment(payment)}
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="booking-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => handleEditBooking(booking)}
                    >
                      ✏️ Edit Booking
                    </button>
                    <button 
                      className="action-btn payment-btn"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowPaymentModal(true);
                      }}
                    >
                      💳 Add Payment
                    </button>
                    <button 
                      className="action-btn preview-btn"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowPreviewModal(true);
                      }}
                    >
                      📄 Preview
                    </button>
                    {booking.bookingStatus === 'CONFIRMED' && (
                      <button 
                        className="action-btn checkin-btn"
                        onClick={() => handleCheckIn(booking.id)}
                      >
                        ✅ Check-in
                      </button>
                    )}
                    {booking.bookingStatus === 'CHECKEDIN' && (
                      <button 
                        className="action-btn checkout-btn"
                        onClick={() => handleCheckOut(booking.id)}
                      >
                        🚪 Check-out
                      </button>
                    )}
                  </div>
                </div>
                );
              })
            ) : (
              <div className="no-bookings">
                <div className="no-bookings-icon">📝</div>
                <h3>No bookings found</h3>
                <p>Try adjusting your search or add a new booking.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="add-booking-placeholder">
            <div className="placeholder-icon">📝</div>
            <h3>Add New Booking</h3>
            <p>Click the "Add Booking" button above to create a new booking.</p>
            <button 
              className="add-booking-btn"
              onClick={() => {
                resetForm();
                setIsEditing(false);
                setSelectedBooking(null);
                setShowBookingModal(true);
              }}
            >
              ➕ Add New Booking
            </button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Booking' : 'Add New Booking'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowBookingModal(false);
                  setIsEditing(false);
                  setSelectedBooking(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateBooking} className="modal-body">
              <div className="form-group">
                <label className="form-label">👤 Customer</label>
                <select
                  className="form-control"
                  value={formData.customerPhoneNumber}
                  onChange={(e) => handleInputChange('customerPhoneNumber', e.target.value)}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.phoneNumber} value={customer.phoneNumber}>
                      {customer.name} - {customer.phoneNumber}
                    </option>
                  ))}
                </select>
                {!formData.customerPhoneNumber && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => navigate('/adminpvt/contacts')}
                      style={{ 
                        color: '#007bff', 
                        textDecoration: 'underline', 
                        fontSize: '14px',
                        padding: '0',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      + Create New Customer
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">🏠 Room</label>
                <select
                  className="form-control"
                  value={formData.roomId}
                  onChange={(e) => handleInputChange('roomId', e.target.value)}
                  required
                >
                  <option value="">Select Room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.roomNumber} - {room.bathroomType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">👥 Number of People</label>
                <select
                  className="form-control"
                  value={formData.numberOfPeople}
                  onChange={(e) => handleInputChange('numberOfPeople', parseInt(e.target.value))}
                  required
                  disabled={!formData.roomId}
                >
                  <option value="">{formData.roomId ? 'Select Number of People' : 'Select Room First'}</option>
                  {formData.roomId ? 
                    (() => {
                      const configs = roomConfigurations.filter(config => config.roomId === parseInt(formData.roomId));
                      console.log('Room ID:', formData.roomId, 'Configs:', configs);
                      return configs
                        .map(config => config.personCount)
                        .sort((a, b) => a - b)
                        .map(num => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? 'Person' : 'People'}
                          </option>
                        ));
                    })() : 
                    [1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Person' : 'People'}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">📅 Check-in Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={toLocalDateString(formData.checkInDate)}
                  onChange={(e) => handleInputChange('checkInDate', new Date(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📅 Check-out Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={toLocalDateString(formData.checkOutDate)}
                  onChange={(e) => handleInputChange('checkOutDate', new Date(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📊 Booking Status</label>
                <select
                  className="form-control"
                  value={formData.bookingStatus}
                  onChange={(e) => handleInputChange('bookingStatus', e.target.value)}
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CHECKEDIN">Checked In</option>
                  <option value="CHECKEDOUT">Checked Out</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">⏱️ Booking Duration Type</label>
                <select
                  className="form-control"
                  value={formData.bookingDurationType}
                  onChange={(e) => handleInputChange('bookingDurationType', e.target.value)}
                  required
                >
                  <option value="DAILY">Daily</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              {formData.bookingDurationType === 'DAILY' && (
                <div className="form-group">
                  <label className="form-label">
                    💰 Daily Cost (₹)
                    <small style={{ color: '#6c757d', marginLeft: '8px' }}>
                      (Auto-populated, editable for bargaining)
                    </small>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.dailyCost}
                    onChange={(e) => handleInputChange('dailyCost', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter daily cost"
                    required
                    style={{ 
                      backgroundColor: formData.dailyCost ? '#f8f9fa' : 'white',
                      border: formData.dailyCost ? '1px solid #28a745' : '1px solid #ced4da'
                    }}
                  />
                </div>
              )}

              {formData.bookingDurationType === 'MONTHLY' && (
                <div className="form-group">
                  <label className="form-label">
                    💰 Monthly Cost (₹)
                    <small style={{ color: '#6c757d', marginLeft: '8px' }}>
                      (Auto-populated, editable for bargaining)
                    </small>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.monthlyCost}
                    onChange={(e) => handleInputChange('monthlyCost', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter monthly cost"
                    required
                    style={{ 
                      backgroundColor: formData.monthlyCost ? '#f8f9fa' : 'white',
                      border: formData.monthlyCost ? '1px solid #28a745' : '1px solid #ced4da'
                    }}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">⏰ Early Check-in Cost (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.earlyCheckinCost}
                  onChange={(e) => handleInputChange('earlyCheckinCost', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Enter early check-in cost"
                />
              </div>

              <div className="form-group">
                <label className="form-label">🕐 Late Check-out Cost (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.lateCheckoutCost}
                  onChange={(e) => handleInputChange('lateCheckoutCost', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Enter late check-out cost"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="mobile-btn mobile-btn-secondary" 
                  onClick={() => {
                    setShowBookingModal(false);
                    setIsEditing(false);
                    setSelectedBooking(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="mobile-btn mobile-btn-primary">
                  {isEditing ? '✏️ Update Booking' : '✅ Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditingPayment ? 'Edit Payment' : 'Add Payment'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowPaymentModal(false);
                  setIsEditingPayment(false);
                  setEditingPaymentId(null);
                  setSelectedBooking(null);
                  setPaymentData({ amount: '', mode: '', createdAt: new Date(), paymentScreenshotUrl: '' });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddPayment} className="modal-body">
              <div className="form-group">
                <label className="form-label">💰 Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                  min="0"
                  step="0.01"
                  placeholder="Enter payment amount"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">💳 Payment Mode</label>
                <select
                  className="form-control"
                  value={paymentData.mode}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, mode: e.target.value }))}
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="CARETAKER">Caretaker</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">📅 Payment Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={toLocalDateString(paymentData.createdAt)}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, createdAt: new Date(e.target.value) }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📸 Payment Screenshot</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*,.pdf"
                  onChange={handlePaymentScreenshotUpload}
                  id="paymentScreenshotFile"
                />
                {paymentData.paymentScreenshotUrl && (
                  <div className="upload-success">
                    <small className="text-success">✅ Payment screenshot uploaded successfully</small>
                    <br />
                    <div style={{ marginTop: '5px' }}>
                      <button
                        onClick={() => handleViewImage(paymentData.paymentScreenshotUrl, 'Payment Screenshot')}
                        className="view-document-btn"
                        style={{ 
                          marginRight: '5px',
                          padding: '4px 8px', 
                          backgroundColor: '#007bff', 
                          color: 'white', 
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        👁️ View
                      </button>
                      <a 
                        href={paymentData.paymentScreenshotUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-document-btn"
                        style={{ 
                          display: 'inline-block', 
                          padding: '4px 8px', 
                          backgroundColor: '#28a745', 
                          color: 'white', 
                          textDecoration: 'none', 
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}
                      >
                        🔗 Open in New Tab
                      </a>
                    </div>
                  </div>
                )}
                <small className="form-text">
                  Upload a screenshot or receipt of the payment (Max 10MB)
                </small>
              </div>

              <div className="form-actions">
                <button type="button" className="mobile-btn mobile-btn-secondary" onClick={() => {
                  setShowPaymentModal(false);
                  setIsEditingPayment(false);
                  setEditingPaymentId(null);
                  setSelectedBooking(null);
                  setPaymentData({ amount: '', mode: '', createdAt: new Date(), paymentScreenshotUrl: '' });
                }}>
                  Cancel
                </button>
                <button type="submit" className="mobile-btn mobile-btn-primary">
                  {isEditingPayment ? '✏️ Update Payment' : '✅ Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>📄 Booking Preview - #{selectedBooking.id}</h3>
              <button className="modal-close" onClick={() => {
                setShowPreviewModal(false);
                setSelectedBooking(null);
              }}>×</button>
            </div>
            <div className="modal-body">
              {(() => {
                const customer = customers.find(c => c.phoneNumber === selectedBooking.customerPhoneNumber);
                const room = rooms.find(r => r.id === selectedBooking.roomId);
                
                return (
                  <div className="booking-preview">
                    <div className="preview-section">
                      <h4>Customer Information</h4>
                      <div className="preview-details">
                        <div className="preview-row">
                          <span className="preview-label">Name:</span>
                          <span className="preview-value">{customer?.name || 'Unknown Customer'}</span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Phone:</span>
                          <span className="preview-value">{selectedBooking.customerPhoneNumber}</span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Email:</span>
                          <span className="preview-value">{customer?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="preview-section">
                      <h4>Booking Details</h4>
                      <div className="preview-details">
                        <div className="preview-row">
                          <span className="preview-label">Room:</span>
                          <span className="preview-value">
                            {room?.roomNumber || `Room ${selectedBooking.roomId}`} ({room?.bathroomType || 'N/A'})
                          </span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Check-in:</span>
                          <span className="preview-value">{new Date(selectedBooking.checkInDate).toLocaleDateString()}</span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Check-out:</span>
                          <span className="preview-value">{new Date(selectedBooking.checkOutDate).toLocaleDateString()}</span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Duration Type:</span>
                          <span className="preview-value">{selectedBooking.bookingDurationType || 'N/A'}</span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Status:</span>
                          <span className="preview-value">
                            <span className={`status-badge ${selectedBooking.bookingStatus?.toLowerCase()}`}>
                              {selectedBooking.bookingStatus}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="preview-section">
                      <h4>Cost Breakdown</h4>
                      <div className="preview-details">
                        {selectedBooking.dailyCost && (
                          <div className="preview-row">
                            <span className="preview-label">Daily Cost:</span>
                            <span className="preview-value">₹{selectedBooking.dailyCost}</span>
                          </div>
                        )}
                        {selectedBooking.monthlyCost && (
                          <div className="preview-row">
                            <span className="preview-label">Monthly Cost:</span>
                            <span className="preview-value">₹{selectedBooking.monthlyCost}</span>
                          </div>
                        )}
                        {selectedBooking.earlyCheckinCost && (
                          <div className="preview-row">
                            <span className="preview-label">Early Check-in Cost:</span>
                            <span className="preview-value">₹{selectedBooking.earlyCheckinCost}</span>
                          </div>
                        )}
                        {selectedBooking.lateCheckoutCost && (
                          <div className="preview-row">
                            <span className="preview-label">Late Check-out Cost:</span>
                            <span className="preview-value">₹{selectedBooking.lateCheckoutCost}</span>
                          </div>
                        )}
                        <div className="preview-row">
                          <span className="preview-label">Total Amount:</span>
                          <span className="preview-value">₹{selectedBooking.totalAmount}</span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Due Amount:</span>
                          <span className="preview-value" style={{ 
                            color: selectedBooking.dueAmount > 0 ? '#dc3545' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            ₹{selectedBooking.dueAmount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                      <div className="preview-section">
                        <h4>Payment History</h4>
                        <div className="payments-list">
                          {selectedBooking.payments.map((payment, index) => (
                            <div key={index} className="payment-item">
                              <div className="payment-info">
                                <span className="payment-amount">₹{payment.amount}</span>
                                <span className="payment-method">{payment.paymentMethod}</span>
                                <span className="payment-date">
                                  {new Date(payment.paymentDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedBooking.remarks && (
                      <div className="preview-section">
                        <h4>Remarks</h4>
                        <p className="preview-remarks">{selectedBooking.remarks}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedBooking(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewing Modal */}
      {showImageModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto' }}>
            <div className="modal-header">
              <h3>{selectedImageTitle}</h3>
              <button className="modal-close" onClick={() => setShowImageModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px', textAlign: 'center' }}>
              <img 
                src={selectedImageUrl} 
                alt={selectedImageTitle}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh', 
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
              <div style={{ marginTop: '15px' }}>
                <a 
                  href={selectedImageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ marginRight: '10px' }}
                >
                  🔗 Open in New Tab
                </a>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowImageModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Conflict Modal */}
      {showConflictModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ backgroundColor: '#dc3545', color: 'white' }}>
              <h3>🚫 Room Not Available</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowConflictModal(false)}
                style={{ color: 'white' }}
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                <p style={{ fontSize: '16px', margin: '0', color: '#dc3545' }}>
                  {conflictMessage}
                </p>
              </div>
              <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>What you can do:</h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#6c757d' }}>
                  <li>Choose different check-in or check-out dates</li>
                  <li>Select a different room</li>
                  <li>Check room availability for your preferred dates</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button 
                className="btn btn-primary"
                onClick={() => setShowConflictModal(false)}
                style={{ padding: '10px 20px' }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaretakerBookingScreen;
