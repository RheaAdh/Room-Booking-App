import React, { useState, useEffect } from 'react';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { toLocalDateTimeString, fromLocalDateTimeString, formatDateForDisplay, toLocalDateString, getTodayDateString } from '../utils/dateUtils';
import './BookingScreen.css';

const BookingScreen = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomConfigurations, setRoomConfigurations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    customerPhoneNumber: '',
    roomId: '',
    numberOfPeople: '',
    checkInDate: new Date(),
    checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
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
      
      // Fetch payments for each booking
      const bookingsWithPayments = await Promise.all(
        bookingsRes.data.map(async (booking) => {
          try {
            const paymentsRes = await api.get(`/payments/booking/${booking.id}`);
            return {
              ...booking,
              payments: paymentsRes.data || []
            };
          } catch (error) {
            console.error(`Error fetching payments for booking ${booking.id}:`, error);
            return {
              ...booking,
              payments: []
            };
          }
        })
      );
      
      setBookings(bookingsWithPayments);
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

  const filteredBookings = bookings.filter(booking => {
    // Exclude CHECKEDOUT bookings
    if (booking.bookingStatus === 'CHECKEDOUT') return false;
    
    if (!searchTerm) return true;
    // Find customer by phone number
    const customer = customers.find(c => c.phoneNumber === booking.customerPhoneNumber);
    const customerName = customer?.name?.toLowerCase() || '';
    const phoneNumber = booking.customerPhoneNumber?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    return customerName.includes(searchLower) || phoneNumber.includes(searchLower);
  });

  const handlePaymentInputChange = (field, value) => {
    setPaymentData(prev => ({
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
      const monthsDiff = Math.ceil(timeDiff / (1000 * 3600 * 24 * 30)); // Approximate months
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
    
    // Validate form
    if (!validateBookingForm(formData)) {
      return;
    }
    
    try {
      // Calculate total cost
      const totalCost = calculateTotalCost(formData);
      
      const bookingPayload = {
        ...formData,
        checkInDate: toLocalDateTimeString(formData.checkInDate),
        checkOutDate: toLocalDateTimeString(formData.checkOutDate),
        totalAmount: totalCost
      };
      
      if (isEditing && selectedBooking) {
        await handleUpdateBooking(selectedBooking.id, bookingPayload);
      } else {
        await api.post('/bookings', bookingPayload);
        alert(`Booking created successfully! Total Amount: ₹${totalCost.toFixed(2)}`);
      }
      
      setShowBookingModal(false);
      setIsEditing(false);
      setSelectedBooking(null);
      resetForm();
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error creating/updating booking:', error);
      if (error.response?.status === 409) {
        setConflictMessage('Room is already booked for the selected dates. Please choose different dates or room.');
        setShowConflictModal(true);
      } else {
        alert('Error creating/updating booking. Please try again.');
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
      numberOfPeople: booking.numberOfPeople || 1,
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

  const handleUpdateBooking = async (bookingId, updatedData) => {
    try {
      await api.put(`/bookings/${bookingId}`, updatedData);
      fetchData(); // Refresh data
      alert('Booking updated successfully!');
    } catch (error) {
      console.error('Error updating booking:', error);
      if (error.response?.status === 409) {
        setConflictMessage('Room is already booked for the selected dates. Please choose different dates or room.');
        setShowConflictModal(true);
      } else {
        alert('Error updating booking. Please try again.');
      }
    }
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
      
      console.log('Payment payload:', paymentPayload);
      console.log('Selected booking:', selectedBooking);
      
      if (isEditingPayment && editingPaymentId) {
        // Update existing payment
        console.log('Updating payment with ID:', editingPaymentId);
        await api.put(`/payments/${editingPaymentId}`, paymentPayload);
        alert('Payment updated successfully!');
      } else {
        // Create new payment
        console.log('Creating new payment for booking:', selectedBooking.id);
        await api.post('/payments', paymentPayload);
        alert('Payment added successfully!');
      }
      
      setShowPaymentModal(false);
      setIsEditingPayment(false);
      setEditingPaymentId(null);
      setPaymentData({ amount: '', mode: '', createdAt: new Date(), paymentScreenshotUrl: '' });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error adding payment:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      alert(`Error adding payment: ${error.response?.data?.message || error.message}. Please try again.`);
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
      mode: payment.paymentMethod, // Fixed: use paymentMethod instead of mode
      createdAt: new Date(payment.paymentDate || payment.createdAt), // Fixed: use paymentDate instead of createdAt
      paymentScreenshotUrl: payment.paymentScreenshotUrl || ''
    });
    setShowPaymentModal(true);
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await api.delete(`/payments/${paymentId}`);
        fetchData();
        alert('Payment deleted successfully!');
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Error deleting payment. Please try again.');
      }
    }
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


  const downloadInvoicePdf = async (bookingId) => {
    try {
      console.log('Downloading invoice for booking:', bookingId);
      
      // Get the HTML preview content and download it as HTML
      const response = await api.get(`/invoices/${bookingId}/preview`);
      
      console.log('Invoice preview response:', {
        status: response.status,
        dataType: typeof response.data,
        dataLength: response.data?.length || 'unknown'
      });
      
      if (response.data) {
        // Create a blob with the HTML content
        const blob = new Blob([response.data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `booking_${bookingId}_invoice.html`);
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

  const resetForm = () => {
    setFormData({
      customerPhoneNumber: '',
      roomId: '',
      numberOfPeople: 1,
      checkInDate: new Date(),
      checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      bookingStatus: 'CONFIRMED',
      bookingDurationType: 'DAILY',
      dailyCost: '',
      monthlyCost: '',
      earlyCheckinCost: ''
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'NEW': { class: 'badge-info', text: 'New' },
      'PENDING': { class: 'badge-warning', text: 'Pending' },
      'CONFIRMED': { class: 'badge-success', text: 'Confirmed' },
      'CHECKED_IN': { class: 'badge-primary', text: 'Checked In' },
      'CHECKED_OUT': { class: 'badge-secondary', text: 'Checked Out' },
      'CANCELLED': { class: 'badge-danger', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { class: 'badge-secondary', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getPaymentModeBadge = (mode) => {
    const modeConfig = {
      'CASH': { class: 'badge-success', text: 'Cash' },
      'ONLINE': { class: 'badge-info', text: 'Online' },
      'CARETAKER': { class: 'badge-secondary', text: 'Caretaker' }
    };
    
    const config = modeConfig[mode] || { class: 'badge-secondary', text: mode };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'PENDING': '#ffc107',
      'CONFIRMED': '#28a745',
      'CHECKEDIN': '#17a2b8',
      'CHECKEDOUT': '#6c757d',
      'CANCELLED': '#dc3545',
      'NO_SHOW': '#fd7e14',
      'COMPLETED': '#20c997'
    };
    return statusColors[status] || '#6c757d';
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="booking-screen">
      <div className="page-header">
        <h1>Booking Management</h1>
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ width: '300px', marginRight: '10px' }}
            />
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowBookingModal(true)}
          >
            + New Booking
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            All Bookings 
            {searchTerm && (
              <span className="text-muted" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                ({filteredBookings.length} of {bookings.length} shown)
              </span>
            )}
          </h3>
        </div>
        <div className="card-body">
          {filteredBookings.length === 0 ? (
            <div className="empty-state">
              <p>{searchTerm ? 'No bookings found matching your search.' : 'No bookings found. Create your first booking!'}</p>
            </div>
          ) : (
            <div className="bookings-list">
              {filteredBookings.map((booking) => {
                // Find customer and room data
                const customer = customers.find(c => c.phoneNumber === booking.customerPhoneNumber);
                const room = rooms.find(r => r.id === booking.roomId);
                
                return (
                <div key={booking.id} className="booking-item">
                  {/* Customer Information Header */}
                  <div className="booking-header">
                    <div className="customer-info">
                      <h3 className="customer-name">{customer?.name || 'Unknown Customer'}</h3>
                      <p className="customer-phone">{booking.customerPhoneNumber}</p>
                      {customer?.email && <p className="customer-email">{customer.email}</p>}
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
                    {/* Room Information */}
                    <div className="detail-row">
                      <span className="detail-label">Room:</span>
                      <span className="detail-value">
                        {room?.roomNumber || `Room ${booking.roomId}`} ({room?.roomType || 'N/A'})
                      </span>
                    </div>
                    
                    {/* Booking Dates */}
                    <div className="detail-row">
                      <span className="detail-label">Check-in:</span>
                      <span className="detail-value">
                        {formatDateForDisplay(booking.checkInDate)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Check-out:</span>
                      <span className="detail-value">
                        {formatDateForDisplay(booking.checkOutDate)}
                      </span>
                    </div>
                    
                    {/* Duration and Type */}
                    <div className="detail-row">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">
                        {Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Booking Type:</span>
                      <span className="detail-value">
                        {booking.bookingDurationType || 'N/A'}
                      </span>
                    </div>
                    
                    {/* Number of People */}
                    <div className="detail-row">
                      <span className="detail-label">Guests:</span>
                      <span className="detail-value">
                        {booking.numberOfPeople || 'N/A'} people
                      </span>
                    </div>
                    
                    {/* Financial Information */}
                    <div className="detail-row">
                      <span className="detail-label">Daily Rate:</span>
                      <span className="detail-value">
                        ₹{booking.dailyCost || '0'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Monthly Rate:</span>
                      <span className="detail-value">
                        ₹{booking.monthlyCost || '0'}
                      </span>
                    </div>
                    {booking.earlyCheckinCost > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Early Check-in:</span>
                        <span className="detail-value">
                          ₹{booking.earlyCheckinCost}
                        </span>
                      </div>
                    )}
                    {booking.lateCheckoutCost > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Late Check-out:</span>
                        <span className="detail-value">
                          ₹{booking.lateCheckoutCost}
                        </span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Total Amount:</span>
                      <span className="detail-value" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        ₹{booking.totalAmount || '0'}
                      </span>
                    </div>
                    
                    {/* Payment Status */}
                    {(() => {
                      const breakdown = calculatePaymentBreakdown(booking);
                      return (
                        <div className="detail-row">
                          <span className="detail-label">Due Amount:</span>
                          <span className="detail-value" style={{ 
                            color: breakdown.dueAmount > 0 ? '#dc3545' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            ₹{breakdown.dueAmount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })()}
                    
                    {/* Booking ID and Timestamps */}
                    <div className="detail-row">
                      <span className="detail-label">Booking ID:</span>
                      <span className="detail-value">
                        #{booking.id}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </span>
                    </div>
                    {booking.remarks && (
                      <div className="detail-row">
                        <span className="detail-label">Remarks:</span>
                        <span className="detail-value">
                          {booking.remarks}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
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

                  {/* Payments */}
                  {booking.payments && booking.payments.length > 0 && (
                    <div className="payments-section">
                      <h5>Payments</h5>
                      <div className="payments-list">
                        {booking.payments.map((payment, index) => (
                          <div key={index} className="payment-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className="payment-amount" style={{ fontWeight: 'bold' }}>₹{payment.amount}</span>
                              {getPaymentModeBadge(payment.paymentMethod)}
                              <span className="payment-date" style={{ fontSize: '12px', color: '#666' }}>
                                {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button 
                                onClick={() => handleEditPayment(payment)}
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '12px', 
                                  backgroundColor: '#007bff', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeletePayment(payment.id)}
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '12px', 
                                  backgroundColor: '#dc3545', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Booking' : 'Create New Booking'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowBookingModal(false);
                  setIsEditing(false);
                  setSelectedBooking(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateBooking} className="modal-body">
              <div className="form-group">
                <label className="form-label">Customer</label>
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
                <label className="form-label">Room</label>
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
                <label className="form-label">Number of People</label>
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
                <label className="form-label">Check-in Date</label>
                <input
                  type="date"
                  value={toLocalDateString(formData.checkInDate)}
                  onChange={(e) => handleInputChange('checkInDate', new Date(e.target.value))}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Check-out Date</label>
                <input
                  type="date"
                  value={toLocalDateString(formData.checkOutDate)}
                  onChange={(e) => handleInputChange('checkOutDate', new Date(e.target.value))}
                  className="form-control"
                  min={toLocalDateString(formData.checkInDate)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Booking Duration Type</label>
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

              <div className="form-group">
                <label className="form-label">
                  Daily Cost (₹) 
                  {formData.bookingDurationType === 'DAILY' && <span style={{ color: 'red' }}> *</span>}
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
                  required={formData.bookingDurationType === 'DAILY'}
                  style={{ 
                    backgroundColor: formData.dailyCost ? '#f8f9fa' : 'white',
                    border: formData.dailyCost ? '1px solid #28a745' : '1px solid #ced4da'
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Monthly Cost (₹) 
                  {formData.bookingDurationType === 'MONTHLY' && <span style={{ color: 'red' }}> *</span>}
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
                  required={formData.bookingDurationType === 'MONTHLY'}
                  style={{ 
                    backgroundColor: formData.monthlyCost ? '#f8f9fa' : 'white',
                    border: formData.monthlyCost ? '1px solid #28a745' : '1px solid #ced4da'
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Early Check-in Cost (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.earlyCheckinCost}
                  onChange={(e) => handleInputChange('earlyCheckinCost', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Enter early check-in cost (optional)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Late Check-out Cost (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.lateCheckoutCost}
                  onChange={(e) => handleInputChange('lateCheckoutCost', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Enter late check-out cost (optional)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={formData.bookingStatus}
                  onChange={(e) => handleInputChange('bookingStatus', e.target.value)}
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

              {/* Cost Preview */}
              <div className="form-group" style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '5px', 
                border: '1px solid #dee2e6' 
              }}>
                <label className="form-label" style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                  💰 Cost Preview
                </label>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {(() => {
                    const checkInDate = new Date(formData.checkInDate);
                    const checkOutDate = new Date(formData.checkOutDate);
                    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
                    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    const monthsDiff = Math.ceil(timeDiff / (1000 * 3600 * 24 * 30));
                    const earlyCheckinCost = parseFloat(formData.earlyCheckinCost) || 0;
                    
                    if (formData.bookingDurationType === 'DAILY') {
                      const dailyCost = parseFloat(formData.dailyCost) || 0;
                      const totalCost = (dailyCost * daysDiff) + earlyCheckinCost;
                      return (
                        <div>
                          <div>Duration: {daysDiff} day(s)</div>
                          <div>Daily Cost: ₹{dailyCost} × {daysDiff} = ₹{(dailyCost * daysDiff).toFixed(2)}</div>
                          {earlyCheckinCost > 0 && <div>Early Check-in: ₹{earlyCheckinCost}</div>}
                          <div style={{ fontWeight: 'bold', marginTop: '5px', fontSize: '16px', color: '#28a745' }}>
                            Total: ₹{totalCost.toFixed(2)}
                          </div>
                        </div>
                      );
                    } else if (formData.bookingDurationType === 'MONTHLY') {
                      const monthlyCost = parseFloat(formData.monthlyCost) || 0;
                      const totalCost = (monthlyCost * monthsDiff) + earlyCheckinCost;
                      return (
                        <div>
                          <div>Duration: {monthsDiff} month(s)</div>
                          <div>Monthly Cost: ₹{monthlyCost} × {monthsDiff} = ₹{(monthlyCost * monthsDiff).toFixed(2)}</div>
                          {earlyCheckinCost > 0 && <div>Early Check-in: ₹{earlyCheckinCost}</div>}
                          <div style={{ fontWeight: 'bold', marginTop: '5px', fontSize: '16px', color: '#28a745' }}>
                            Total: ₹{totalCost.toFixed(2)}
                          </div>
                        </div>
                      );
                    } else {
                      return <div>Select duration type and enter costs to see preview</div>;
                    }
                  })()}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update Booking' : 'Create Booking'}
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
                className="modal-close"
                onClick={() => {
                  setShowPaymentModal(false);
                  setIsEditingPayment(false);
                  setEditingPaymentId(null);
                  setPaymentData({ amount: '', mode: '', createdAt: new Date(), paymentScreenshotUrl: '' });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddPayment} className="modal-body">
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  className="form-control"
                  value={paymentData.amount}
                  onChange={(e) => handlePaymentInputChange('amount', e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-control"
                  value={paymentData.mode}
                  onChange={(e) => handlePaymentInputChange('mode', e.target.value)}
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="CARETAKER">Caretaker</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  value={toLocalDateString(paymentData.createdAt)}
                  onChange={(e) => handlePaymentInputChange('createdAt', new Date(e.target.value))}
                  className="form-control"
                  max={getTodayDateString()}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Screenshot (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePaymentScreenshotUpload(e)}
                  className="form-control"
                />
                {paymentData.paymentScreenshotUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <img 
                      src={paymentData.paymentScreenshotUrl} 
                      alt="Payment Screenshot" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '150px', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleViewImage(paymentData.paymentScreenshotUrl, 'Payment Screenshot')}
                      title="Click to view full size"
                    />
                    <div style={{ marginTop: '5px' }}>
                      <button 
                        type="button"
                        onClick={() => handleViewImage(paymentData.paymentScreenshotUrl, 'Payment Screenshot')}
                        style={{ 
                          marginRight: '5px', 
                          padding: '4px 8px', 
                          fontSize: '12px', 
                          backgroundColor: '#007bff', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        👁️ View
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentData({...paymentData, paymentScreenshotUrl: ''})}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '12px', 
                          backgroundColor: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowPaymentModal(false);
                  setIsEditingPayment(false);
                  setEditingPaymentId(null);
                  setPaymentData({ amount: '', mode: '', createdAt: new Date(), paymentScreenshotUrl: '' });
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditingPayment ? 'Update Payment' : 'Add Payment'}
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
                const breakdown = calculatePaymentBreakdown(selectedBooking);
                
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
                          <span className="preview-value">₹{breakdown.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Total Paid:</span>
                          <span className="preview-value" style={{ color: '#28a745' }}>₹{breakdown.totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Due Amount:</span>
                          <span className="preview-value" style={{ 
                            color: breakdown.dueAmount > 0 ? '#dc3545' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            ₹{breakdown.dueAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Payment Count:</span>
                          <span className="preview-value">{breakdown.paymentCount} payment(s)</span>
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
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => downloadInvoicePdf(selectedBooking.id)}
              >
                📥 Download PDF
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

export default BookingScreen;
