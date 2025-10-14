import React, { useState, useEffect } from 'react';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import api from '../config/api';
import './BookingScreen.css';

const BookingScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    customerPhoneNumber: '',
    roomId: '',
    checkInDate: new Date(),
    checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
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

  const filteredBookings = bookings.filter(booking => {
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
        checkInDate: formData.checkInDate.toISOString(),
        checkOutDate: formData.checkOutDate.toISOString(),
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
        alert('Room is already booked for the selected dates. Please choose different dates or room.');
      } else {
        alert('Error creating/updating booking. Please try again.');
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

  const handleUpdateBooking = async (bookingId, updatedData) => {
    try {
      await api.put(`/bookings/${bookingId}`, updatedData);
      fetchData(); // Refresh data
      alert('Booking updated successfully!');
    } catch (error) {
      console.error('Error updating booking:', error);
      if (error.response?.status === 409) {
        alert('Room is already booked for the selected dates. Please choose different dates or room.');
      } else {
        alert('Error updating booking. Please try again.');
      }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await api.delete(`/bookings/${bookingId}`);
        fetchData(); // Refresh data
        alert('Booking deleted successfully!');
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Error deleting booking. Please try again.');
      }
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      const paymentPayload = {
        bookingId: selectedBooking.id, // Add the required bookingId
        amount: parseFloat(paymentData.amount) || 0, // Ensure amount is a number
        paymentMethod: paymentData.mode, // Map mode to paymentMethod
        paymentScreenshotUrl: paymentData.paymentScreenshotUrl || '',
        paymentDate: paymentData.createdAt.toISOString().split('T')[0] // Map createdAt to paymentDate in YYYY-MM-DD format
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

    // For now, just show an error message since the upload endpoint doesn't exist
    alert('❌ Payment screenshot upload is not available yet. Please contact the administrator to upload payment screenshots manually.');
    e.target.value = ''; // Clear the file input
  };

  const generateInvoice = async (bookingId) => {
    try {
      const response = await api.get(`/invoices/${bookingId}/preview`);
      const invoiceWindow = window.open('', '_blank');
      invoiceWindow.document.write(response.data);
      invoiceWindow.document.close();
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
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
                  <div className="booking-header">
                    <div className="booking-info">
                      <h4>{customer?.name || 'Unknown Customer'}</h4>
                      <p className="booking-id">Booking #{booking.id}</p>
                    </div>
                    <div className="booking-actions">
                      {getStatusBadge(booking.bookingStatus)}
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEditBooking(booking)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowPaymentModal(true);
                        }}
                      >
                        Add Payment
                      </button>
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => generateInvoice(booking.id)}
                      >
                        📄 Preview
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => downloadInvoicePdf(booking.id)}
                      >
                        📥 Download PDF
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteBooking(booking.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="booking-details">
                    <div className="detail-row">
                      <span className="detail-label">Room:</span>
                      <span className="detail-value">
                        {room?.roomNumber || `Room ${booking.roomId}`} ({room?.roomType || 'N/A'})
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Check-in:</span>
                      <span className="detail-value">
                        {new Date(booking.checkInDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Check-out:</span>
                      <span className="detail-value">
                        {new Date(booking.checkOutDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">
                        {booking.customer?.phoneNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Duration Type:</span>
                      <span className="detail-value">
                        {booking.bookingDurationType || 'N/A'}
                      </span>
                    </div>
                    {booking.dailyCost && (
                      <div className="detail-row">
                        <span className="detail-label">Daily Cost:</span>
                        <span className="detail-value">₹{booking.dailyCost}</span>
                      </div>
                    )}
                    {booking.monthlyCost && (
                      <div className="detail-row">
                        <span className="detail-label">Monthly Cost:</span>
                        <span className="detail-value">₹{booking.monthlyCost}</span>
                      </div>
                    )}
                    {booking.earlyCheckinCost && (
                      <div className="detail-row">
                        <span className="detail-label">Early Check-in Cost:</span>
                        <span className="detail-value">₹{booking.earlyCheckinCost}</span>
                      </div>
                    )}
                    {(() => {
                      const breakdown = calculatePaymentBreakdown(booking);
                      return (
                        <>
                          <div className="detail-row">
                            <span className="detail-label">Total Amount:</span>
                            <span className="detail-value">₹{breakdown.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Total Paid:</span>
                            <span className="detail-value" style={{ color: '#28a745' }}>₹{breakdown.totalPaid.toFixed(2)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Due Amount:</span>
                            <span className="detail-value" style={{ 
                              color: breakdown.dueAmount > 0 ? '#dc3545' : '#28a745',
                              fontWeight: 'bold'
                            }}>
                              ₹{breakdown.dueAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Payment Count:</span>
                            <span className="detail-value">{breakdown.paymentCount} payment(s)</span>
                          </div>
                        </>
                      );
                    })()}
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
                      {room.roomNumber} - {room.roomType} (₹{room.monthlyReferenceCost || room.dailyReferenceCost}/month)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Check-in Date</label>
                <input
                  type="date"
                  value={formData.checkInDate.toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('checkInDate', new Date(e.target.value))}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Check-out Date</label>
                <input
                  type="date"
                  value={formData.checkOutDate.toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('checkOutDate', new Date(e.target.value))}
                  className="form-control"
                  min={formData.checkInDate.toISOString().split('T')[0]}
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
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Monthly Cost (₹) 
                  {formData.bookingDurationType === 'MONTHLY' && <span style={{ color: 'red' }}> *</span>}
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
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={formData.bookingStatus}
                  onChange={(e) => handleInputChange('bookingStatus', e.target.value)}
                >
                  <option value="NEW">New</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="CHECKED_OUT">Checked Out</option>
                  <option value="CANCELLED">Cancelled</option>
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
                  value={paymentData.createdAt.toISOString().split('T')[0]}
                  onChange={(e) => handlePaymentInputChange('createdAt', new Date(e.target.value))}
                  className="form-control"
                  max={new Date().toISOString().split('T')[0]}
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
                      style={{ maxWidth: '200px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setPaymentData({...paymentData, paymentScreenshotUrl: ''})}
                      style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                    >
                      Remove
                    </button>
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
    </div>
  );
};

export default BookingScreen;
