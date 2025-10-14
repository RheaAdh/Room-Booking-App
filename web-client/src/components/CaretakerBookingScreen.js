import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './CaretakerBookingScreen.css';

const CaretakerBookingScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'
  
  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
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
      const [bookingsRes, roomsRes, customersRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/rooms'),
        api.get('/customer')
      ]);
      setBookings(bookingsRes.data);
      setRooms(roomsRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        checkInDate: formData.checkInDate.toISOString(),
        checkOutDate: formData.checkOutDate.toISOString(),
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
        alert('❌ Room is already booked for the selected dates. Please choose different dates or room.');
      } else {
        alert('❌ Error creating/updating booking. Please try again.');
      }
    }
  };

  const handleEditBooking = (booking) => {
    setFormData({
      customerPhoneNumber: booking.customerPhoneNumber || '',
      roomId: booking.roomId || '',
      checkInDate: new Date(booking.checkInDate),
      checkOutDate: new Date(booking.checkOutDate),
      bookingStatus: booking.bookingStatus,
      bookingDurationType: booking.bookingDurationType || 'DAILY',
      dailyCost: booking.dailyCost || '',
      monthlyCost: booking.monthlyCost || '',
      earlyCheckinCost: booking.earlyCheckinCost || ''
    });
    setSelectedBooking(booking);
    setIsEditing(true);
    setShowBookingModal(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      const paymentPayload = {
        ...paymentData,
        createdAt: paymentData.createdAt.toISOString()
      };
      
      if (isEditingPayment && editingPaymentId) {
        // Update existing payment
        await api.put(`/payments/${editingPaymentId}`, paymentPayload);
        alert('✅ Payment updated successfully!');
      } else {
        // Create new payment
        await api.post(`/bookings/${selectedBooking.id}/payments`, paymentPayload);
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/payments/upload-screenshot-new', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setPaymentData(prev => ({
          ...prev,
          paymentScreenshotUrl: response.data.fileUrl
        }));
        alert('✅ Payment screenshot uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading payment screenshot:', error);
      alert('❌ Error uploading payment screenshot. Please try again.');
    }
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

  const filteredBookings = bookings.filter(booking => {
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
                      <span className="detail-label">📅 Check-in:</span>
                      <span className="detail-value">
                        {new Date(booking.checkInDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📅 Check-out:</span>
                      <span className="detail-value">
                        {new Date(booking.checkOutDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">💰 Total:</span>
                      <span className="detail-value">₹{booking.totalAmount}</span>
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
                      {room.roomNumber} - {room.roomType} ({room.bathroomType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">📅 Check-in Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.checkInDate.toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('checkInDate', new Date(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📅 Check-out Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.checkOutDate.toISOString().split('T')[0]}
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
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                      <option value="CHECKEDOUT">Checked Out</option>
                      <option value="CHECKEDIN">Checked In</option>
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
                  <label className="form-label">💰 Daily Cost (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.dailyCost}
                    onChange={(e) => handleInputChange('dailyCost', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter daily cost"
                    required
                  />
                </div>
              )}

              {formData.bookingDurationType === 'MONTHLY' && (
                <div className="form-group">
                  <label className="form-label">💰 Monthly Cost (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.monthlyCost}
                    onChange={(e) => handleInputChange('monthlyCost', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter monthly cost"
                    required
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
                  value={paymentData.createdAt.toISOString().split('T')[0]}
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
                    <a 
                      href={paymentData.paymentScreenshotUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-document-btn"
                    >
                      📄 View Uploaded Screenshot
                    </a>
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
    </div>
  );
};

export default CaretakerBookingScreen;
