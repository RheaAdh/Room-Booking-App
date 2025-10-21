import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { toLocalDateTimeString, fromLocalDateTimeString, toLocalDateString } from '../utils/dateUtils';
import './CaretakerBookingScreen.css';

const BookingScreen = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomConfigurations, setRoomConfigurations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt', 'checkInDate', 'customerName', 'totalAmount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'CONFIRMED', 'CHECKEDIN', 'CHECKEDOUT', 'CANCELLED'
  
  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  
  // Customer search and contact creation states
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    phoneNumber: '',
    additionalPhoneNumber: '',
    photoIdProofUrl: ''
  });
  const [newCustomerFormData, setNewCustomerFormData] = useState({
    name: '',
    phoneNumber: '',
    additionalPhoneNumber: '',
    photoIdProofUrl: '',
    remarks: '',
    idProofUrls: []
  });
  
  // Payments dropdown state
  const [expandedPayments, setExpandedPayments] = useState(new Set());
  
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
    lateCheckoutCost: '',
    remarks: ''
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
      
      // Add customer names to bookings
      const bookingsWithCustomerNames = bookingsWithPayments.map(booking => {
        const customer = customersRes.data.find(c => c.phoneNumber === booking.customerPhoneNumber);
        return {
          ...booking,
          customerName: customer ? customer.name : 'Unknown Customer'
        };
      });
      
      setBookings(bookingsWithCustomerNames);
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
      
      // Auto-populate costs when room is selected
      if (field === 'roomId' && value) {
        const roomConfig = getRoomConfiguration(value, newFormData.numberOfPeople);
        if (roomConfig) {
          newFormData.dailyCost = roomConfig.dailyCost || '';
          newFormData.monthlyCost = roomConfig.monthlyCost || '';
        }
      }
      
      // Auto-populate costs when number of people changes
      if (field === 'numberOfPeople' && newFormData.roomId) {
        const roomConfig = getRoomConfiguration(newFormData.roomId, value);
        if (roomConfig) {
          newFormData.dailyCost = roomConfig.dailyCost || '';
          newFormData.monthlyCost = roomConfig.monthlyCost || '';
        }
      }
      
      return newFormData;
    });
  };

  const getRoomConfiguration = (roomId, personCount = null) => {
    // Find room configurations that match the room ID
    let configs = roomConfigurations.filter(config => config.roomId === roomId);
    
    // If personCount is specified, try to find exact match
    if (personCount && configs.length > 0) {
      const exactMatch = configs.find(config => config.personCount === personCount);
      if (exactMatch) return exactMatch;
    }
    
    // Return the first available configuration for the room
    return configs.find(config => config.isAvailable) || configs[0] || null;
  };

  const calculateTotalCost = () => {
    const { dailyCost, monthlyCost, earlyCheckinCost, lateCheckoutCost, bookingDurationType } = formData;
    
    let baseCost = 0;
    if (bookingDurationType === 'DAILY' && dailyCost) {
      baseCost = parseFloat(dailyCost) || 0;
    } else if (bookingDurationType === 'MONTHLY' && monthlyCost) {
      baseCost = parseFloat(monthlyCost) || 0;
    }
    
    const earlyCost = parseFloat(earlyCheckinCost) || 0;
    const lateCost = parseFloat(lateCheckoutCost) || 0;
    
    return baseCost + earlyCost + lateCost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const totalAmount = calculateTotalCost();
      const bookingData = {
        ...formData,
        // Convert string values to proper types
        roomId: formData.roomId ? parseInt(formData.roomId) : null,
        numberOfPeople: formData.numberOfPeople ? parseInt(formData.numberOfPeople) : 1,
        dailyCost: formData.dailyCost ? parseFloat(formData.dailyCost) : null,
        monthlyCost: formData.monthlyCost ? parseFloat(formData.monthlyCost) : null,
        earlyCheckinCost: formData.earlyCheckinCost ? parseFloat(formData.earlyCheckinCost) : null,
        lateCheckoutCost: formData.lateCheckoutCost ? parseFloat(formData.lateCheckoutCost) : null,
        totalAmount: totalAmount,
        checkInDate: toLocalDateTimeString(formData.checkInDate),
        checkOutDate: toLocalDateTimeString(formData.checkOutDate),
        createdAt: toLocalDateTimeString(new Date())
      };

      if (isEditing && selectedBooking) {
        console.log('🔄 UPDATE BOOKING REQUEST');
        console.log('📋 Booking ID:', selectedBooking.id);
        console.log('📊 Request Payload:', JSON.stringify(bookingData, null, 2));
        
        const response = await api.put(`/bookings/${selectedBooking.id}`, bookingData);
        
        console.log('✅ UPDATE SUCCESS - Response:', response.data);
        alert('Booking updated successfully!');
      } else {
        console.log('🆕 CREATE BOOKING REQUEST');
        console.log('📊 Request Payload:', JSON.stringify(bookingData, null, 2));
        
        const response = await api.post('/bookings', bookingData);
        
        console.log('✅ CREATE SUCCESS - Response:', response.data);
        alert('Booking created successfully!');
      }
      
      setShowBookingModal(false);
      setIsEditing(false);
      setSelectedBooking(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving booking:', error);
      if (error.response?.data?.message?.includes('conflict')) {
        setConflictMessage(error.response.data.message);
        setShowConflictModal(true);
      } else {
        alert('Error saving booking. Please try again.');
      }
    }
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setIsEditing(true);
    setShowBookingModal(true);
    
    // Parse dates properly
    let checkInDate, checkOutDate;
    
    if (booking.checkInDate) {
      if (typeof booking.checkInDate === 'string') {
        checkInDate = new Date(booking.checkInDate);
      } else {
        checkInDate = booking.checkInDate;
      }
    } else {
      checkInDate = new Date();
    }
    
    if (booking.checkOutDate) {
      if (typeof booking.checkOutDate === 'string') {
        checkOutDate = new Date(booking.checkOutDate);
      } else {
        checkOutDate = booking.checkOutDate;
      }
    } else {
      checkOutDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    
    // Validate dates
    if (isNaN(checkInDate.getTime())) {
      checkInDate = new Date();
    }
    if (isNaN(checkOutDate.getTime())) {
      checkOutDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    
    // Find the customer name from the phone number
    const customer = customers.find(c => c.phoneNumber === booking.customerPhoneNumber);
    const customerName = customer ? customer.name : '';
    
    setFormData({
      customerPhoneNumber: booking.customerPhoneNumber || '',
      roomId: booking.roomId || '',
      numberOfPeople: booking.numberOfPeople || '',
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      bookingStatus: booking.bookingStatus || 'CONFIRMED',
      bookingDurationType: booking.bookingDurationType || 'DAILY',
      dailyCost: booking.dailyCost || '',
      monthlyCost: booking.monthlyCost || '',
      earlyCheckinCost: booking.earlyCheckinCost || '',
      lateCheckoutCost: booking.lateCheckoutCost || '',
      remarks: booking.remarks || ''
    });
    
    // Set the customer search term to show the selected customer's name
    setCustomerSearchTerm(customerName);
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await api.delete(`/bookings/${bookingId}`);
        alert('Booking deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Error deleting booking. Please try again.');
      }
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/checkin`);
      alert('Check-in successful!');
      fetchData();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Error checking in. Please try again.');
    }
  };

  const handleCheckOut = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/checkout`);
      alert('Check-out successful!');
      fetchData();
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Error checking out. Please try again.');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    try {
      const paymentDataToSend = {
        ...paymentData,
        bookingId: selectedBooking.id,
        createdAt: toLocalDateTimeString(paymentData.createdAt)
      };

      if (isEditingPayment && editingPaymentId) {
        await api.put(`/payments/${editingPaymentId}`, paymentDataToSend);
        alert('Payment updated successfully!');
      } else {
        await api.post('/payments', paymentDataToSend);
        alert('Payment added successfully!');
      }
      
      setShowPaymentModal(false);
      setIsEditingPayment(false);
      setEditingPaymentId(null);
      setPaymentData({
        amount: '',
        mode: '',
        createdAt: new Date(),
        paymentScreenshotUrl: ''
      });
      
      // Immediately update the selected booking and main bookings list
      const updatedBooking = await api.get(`/bookings/${selectedBooking.id}`);
      const paymentsRes = await api.get(`/payments/booking/${selectedBooking.id}`);
      const updatedBookingWithPayments = {
        ...updatedBooking.data,
        payments: paymentsRes.data || []
      };
      
      setSelectedBooking(updatedBookingWithPayments);
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? updatedBookingWithPayments : b));
      
      fetchData();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Error saving payment. Please try again.');
    }
  };

  const handleEditPayment = (payment) => {
    setPaymentData({
      amount: payment.amount,
      mode: payment.paymentMethod || '',
      createdAt: new Date(payment.paymentDate || payment.createdAt),
      paymentScreenshotUrl: payment.paymentScreenshotUrl || ''
    });
    setIsEditingPayment(true);
    setEditingPaymentId(payment.id);
    setShowPaymentModal(true);
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await api.delete(`/payments/${paymentId}`);
        alert('Payment deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Error deleting payment. Please try again.');
      }
    }
  };

  const handleUploadPaymentScreenshot = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/payment-screenshot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setPaymentData(prev => ({
        ...prev,
        paymentScreenshotUrl: response.data.url
      }));
    } catch (error) {
      console.error('Error uploading payment screenshot:', error);
      alert('Error uploading payment screenshot. Please try again.');
    }
  };

  const handleViewImage = (imageUrl, title) => {
    if (!imageUrl) {
      alert('No image available');
      return;
    }
    setSelectedImageUrl(imageUrl);
    setSelectedImageTitle(title);
    setShowImageModal(true);
  };

  const resetForm = () => {
    setFormData({
      customerPhoneNumber: '',
      roomId: '',
      numberOfPeople: '',
      checkInDate: new Date(),
      checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      bookingStatus: 'CONFIRMED',
      bookingDurationType: 'DAILY',
      dailyCost: '',
      monthlyCost: '',
      earlyCheckinCost: '',
      lateCheckoutCost: '',
      remarks: ''
    });
    setCustomerSearchTerm('');
    setShowCustomerSearch(false);
    setFilteredCustomers([]);
  };

  const resetNewCustomerForm = () => {
    setNewCustomerFormData({
      name: '',
      phoneNumber: '',
      additionalPhoneNumber: '',
      photoIdProofUrl: '',
      remarks: '',
      idProofUrls: []
    });
  };

  const handleNewCustomerIdProofUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadFormData = new FormData();
      files.forEach(file => {
        uploadFormData.append('files', file);
      });

      const response = await api.post('/upload/multiple-id-proofs', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewCustomerFormData(prev => ({
        ...prev,
        idProofUrls: [...prev.idProofUrls, ...response.data.urls]
      }));
    } catch (error) {
      console.error('Error uploading ID proofs:', error);
      alert('Error uploading ID proofs. Please try again.');
    }
  };

  const handleViewNewCustomerImage = (imageUrl, title) => {
    if (!imageUrl) {
      alert('No image available');
      return;
    }
    setSelectedImageUrl(imageUrl);
    setSelectedImageTitle(title);
    setShowImageModal(true);
  };

  const downloadInvoicePdf = async (bookingId) => {
    try {
      console.log('Downloading invoice for booking:', bookingId);
      
      // Open the invoice URL directly in a new tab
      const invoiceUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8082'}/api/v1/invoices/${bookingId}/download`;
      window.open(invoiceUrl, '_blank');
      
      console.log('Invoice opened in new window successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      alert('❌ Error downloading invoice. Please try again.');
    }
  };

  // Customer search functions
  const handleCustomerSearch = (term) => {
    setCustomerSearchTerm(term);
    if (term.length > 0) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(term.toLowerCase()) ||
        customer.phoneNumber.includes(term)
      );
      setFilteredCustomers(filtered);
      setShowCustomerSearch(true);
    } else {
      setShowCustomerSearch(false);
      setFilteredCustomers([]);
    }
  };

  const handleSelectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerPhoneNumber: customer.phoneNumber
    }));
    setCustomerSearchTerm(customer.name);
    setShowCustomerSearch(false);
    setShowNewCustomerForm(false);
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/customer', contactFormData);
      const newCustomer = response.data;
      
      setCustomers(prev => [...prev, newCustomer]);
      setFormData(prev => ({
        ...prev,
        customerPhoneNumber: newCustomer.phoneNumber
      }));
      setCustomerSearchTerm(newCustomer.name);
      setShowContactForm(false);
      setContactFormData({
        name: '',
        phoneNumber: '',
        additionalPhoneNumber: '',
        photoIdProofUrl: ''
      });
      alert('Contact created successfully!');
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Error creating contact. Please try again.');
    }
  };

  const handleCreateNewCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/customer', newCustomerFormData);
      const newCustomer = response.data;
      
      setCustomers(prev => [...prev, newCustomer]);
      setFormData(prev => ({
        ...prev,
        customerPhoneNumber: newCustomer.phoneNumber
      }));
      setCustomerSearchTerm(newCustomer.name);
      setShowNewCustomerForm(false);
      resetNewCustomerForm();
      alert('Customer created successfully!');
    } catch (error) {
      console.error('Error creating new customer:', error);
      alert('Error creating new customer. Please try again.');
    }
  };

  // Payments dropdown functions
  const togglePaymentsDropdown = (bookingId) => {
    const newExpanded = new Set(expandedPayments);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedPayments(newExpanded);
  };

  const handleEditPaymentFromDropdown = (payment) => {
    handleEditPayment(payment);
  };

  // Helper functions
  const calculateDueAmount = (booking) => {
    const totalAmount = booking.totalAmount || 0;
    const paidAmount = booking.payments?.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0) || 0;
    return Math.max(0, totalAmount - paidAmount);
  };

  const getPaymentStatus = (booking) => {
    const dueAmount = calculateDueAmount(booking);
    return dueAmount > 0 ? 'PENDING' : 'PAID';
  };

  // Filter and sort bookings
  const filteredAndSortedBookings = bookings
    .filter(booking => {
      const matchesSearch = !searchTerm || 
        booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerPhoneNumber?.includes(searchTerm) ||
        rooms.find(r => r.id === booking.roomId)?.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.bookingStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'checkInDate':
          aValue = new Date(a.checkInDate);
          bValue = new Date(b.checkInDate);
          break;
        case 'customerName':
          aValue = a.customerName || '';
          bValue = b.customerName || '';
          break;
        case 'totalAmount':
          aValue = a.totalAmount || 0;
          bValue = b.totalAmount || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="caretaker-booking-screen">
      {/* Search Filter Bar */}
      <div className="search-filter-bar">
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
      </div>

      {/* Bookings List */}
      <div className="bookings-container">
        <div className="bookings-header">
          <h2>All Bookings ({filteredAndSortedBookings.length})</h2>
        </div>

        <div className="bookings-list">
          {filteredAndSortedBookings.map((booking) => {
            const room = rooms.find(r => r.id === booking.roomId);
            const dueAmount = calculateDueAmount(booking);
            const paymentStatus = getPaymentStatus(booking);
            
            return (
              <div key={booking.id} className="compact-booking-card">
                <div className="compact-booking-content">
                  <div className="compact-booking-main">
                    <div className="compact-booking-info">
                      <div className="compact-customer-name">{booking.customerName || 'Unknown'}</div>
                      <div className="compact-phone">📞 {booking.customerPhoneNumber}</div>
                      <div className="compact-room">🏠 {room?.roomNumber || 'N/A'}</div>
                      <div className="compact-due">₹{dueAmount} due</div>
                    </div>
                    <div className="compact-booking-status">
                      <span className={`compact-status-badge ${booking.bookingStatus.toLowerCase()}`}>
                        {booking.bookingStatus}
                      </span>
                    </div>
                  </div>
                  <div className="compact-booking-actions">
                    <button 
                      className="compact-action-btn edit-btn"
                      onClick={() => handleEditBooking(booking)}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="compact-action-btn download-btn"
                      onClick={() => downloadInvoicePdf(booking.id)}
                    >
                      📥 Invoice
                    </button>
                    {booking.bookingStatus === 'CONFIRMED' && (
                      <button 
                        className="compact-action-btn checkin-btn"
                        onClick={() => handleCheckIn(booking.id)}
                      >
                        ✅ Check-in
                      </button>
                    )}
                    {booking.bookingStatus === 'CHECKEDIN' && (
                      <button 
                        className="compact-action-btn checkout-btn"
                        onClick={() => handleCheckOut(booking.id)}
                      >
                        🚪 Check-out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        className="fab-create-booking"
        onClick={() => {
          setShowBookingModal(true);
          setIsEditing(false);
          setSelectedBooking(null);
          resetForm();
        }}
        title="Create New Booking"
      >
        <span className="fab-icon">+</span>
      </button>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal-content booking-modal">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Booking' : 'Create New Booking'}</h3>
              <button 
                className="modal-close"
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
            
            <form onSubmit={handleSubmit} className="booking-form">
              {/* Customer Search */}
              <div className="form-group">
                <label className="form-label">Customer *</label>
                <div className="customer-search-container">
                  <input
                    type="text"
                    placeholder="Search customer by name or phone..."
                    value={customerSearchTerm}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    className="form-control"
                    required
                  />
                  {showCustomerSearch && (
                    <div className="customer-search-results">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                          <div 
                            key={customer.phoneNumber}
                            className="customer-search-item"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <div className="customer-name">{customer.name}</div>
                            <div className="customer-phone">📞 {customer.phoneNumber}</div>
                          </div>
                        ))
                      ) : (
                        <div className="no-customers-found">No customers found</div>
                      )}
                    </div>
                  )}
                  {customerSearchTerm && !showCustomerSearch && (
                    <div className="selected-customer">
                      Selected: {customerSearchTerm}
                      <button 
                        type="button"
                        onClick={() => {
                          setCustomerSearchTerm('');
                          setFormData(prev => ({ ...prev, customerPhoneNumber: '' }));
                        }}
                        className="change-customer-btn"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Create New Customer Section */}
              {!isEditing && (
                <div className="create-customer-section">
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                  >
                    {showNewCustomerForm ? 'Cancel' : '+ Create New Customer'}
                  </button>
                </div>
              )}

              {/* New Customer Form */}
              {showNewCustomerForm && !isEditing && (
                <div className="new-customer-form">
                  <h4>Create New Customer</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        value={newCustomerFormData.name}
                        onChange={(e) => setNewCustomerFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number *</label>
                      <input
                        type="tel"
                        value={newCustomerFormData.phoneNumber}
                        onChange={(e) => setNewCustomerFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Additional Phone</label>
                      <input
                        type="tel"
                        value={newCustomerFormData.additionalPhoneNumber}
                        onChange={(e) => setNewCustomerFormData(prev => ({ ...prev, additionalPhoneNumber: e.target.value }))}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Remarks</label>
                      <input
                        type="text"
                        value={newCustomerFormData.remarks}
                        onChange={(e) => setNewCustomerFormData(prev => ({ ...prev, remarks: e.target.value }))}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ID Proof Upload</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleNewCustomerIdProofUpload}
                      className="form-control"
                    />
                    {newCustomerFormData.idProofUrls.length > 0 && (
                      <div className="uploaded-images">
                        {newCustomerFormData.idProofUrls.map((url, index) => (
                          <div key={index} className="uploaded-image-item">
                            <img 
                              src={url} 
                              alt={`ID Proof ${index + 1}`}
                              onClick={() => handleViewNewCustomerImage(url, `ID Proof ${index + 1}`)}
                              className="uploaded-image"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newUrls = newCustomerFormData.idProofUrls.filter((_, i) => i !== index);
                                setNewCustomerFormData(prev => ({ ...prev, idProofUrls: newUrls }));
                              }}
                              className="remove-image-btn"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCreateNewCustomer}
                  >
                    Create Customer
                  </button>
                </div>
              )}

              {/* Room Selection */}
              <div className="form-group">
                <label className="form-label">Room *</label>
                <select
                  value={formData.roomId}
                  onChange={(e) => handleInputChange('roomId', e.target.value)}
                  className="form-control"
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

              {/* Number of People */}
              <div className="form-group">
                <label className="form-label">Number of People *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.numberOfPeople}
                  onChange={(e) => handleInputChange('numberOfPeople', e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              {/* Check-in and Check-out Dates */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Check-in Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.checkInDate ? 
                      `${formData.checkInDate.getFullYear()}-${String(formData.checkInDate.getMonth() + 1).padStart(2, '0')}-${String(formData.checkInDate.getDate()).padStart(2, '0')}T${String(formData.checkInDate.getHours()).padStart(2, '0')}:${String(formData.checkInDate.getMinutes()).padStart(2, '0')}` 
                      : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        // Create date in local timezone to avoid timezone conversion issues
                        const [datePart, timePart] = dateValue.split('T');
                        const [year, month, day] = datePart.split('-').map(Number);
                        const [hours, minutes] = timePart.split(':').map(Number);
                        const localDate = new Date(year, month - 1, day, hours, minutes);
                        handleInputChange('checkInDate', localDate);
                      } else {
                        handleInputChange('checkInDate', null);
                      }
                    }}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Check-out Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.checkOutDate ? 
                      `${formData.checkOutDate.getFullYear()}-${String(formData.checkOutDate.getMonth() + 1).padStart(2, '0')}-${String(formData.checkOutDate.getDate()).padStart(2, '0')}T${String(formData.checkOutDate.getHours()).padStart(2, '0')}:${String(formData.checkOutDate.getMinutes()).padStart(2, '0')}` 
                      : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        // Create date in local timezone to avoid timezone conversion issues
                        const [datePart, timePart] = dateValue.split('T');
                        const [year, month, day] = datePart.split('-').map(Number);
                        const [hours, minutes] = timePart.split(':').map(Number);
                        const localDate = new Date(year, month - 1, day, hours, minutes);
                        handleInputChange('checkOutDate', localDate);
                      } else {
                        handleInputChange('checkOutDate', null);
                      }
                    }}
                    className="form-control"
                    min={formData.checkInDate ? 
                      `${formData.checkInDate.getFullYear()}-${String(formData.checkInDate.getMonth() + 1).padStart(2, '0')}-${String(formData.checkInDate.getDate()).padStart(2, '0')}T${String(formData.checkInDate.getHours()).padStart(2, '0')}:${String(formData.checkInDate.getMinutes()).padStart(2, '0')}` 
                      : ''}
                    required
                  />
                </div>
              </div>

              {/* Booking Status and Duration */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Booking Status</label>
                  <select
                    value={formData.bookingStatus}
                    onChange={(e) => handleInputChange('bookingStatus', e.target.value)}
                    className="form-control"
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CHECKEDIN">Checked In</option>
                    <option value="CHECKEDOUT">Checked Out</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration Type</label>
                  <select
                    value={formData.bookingDurationType}
                    onChange={(e) => handleInputChange('bookingDurationType', e.target.value)}
                    className="form-control"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Cost Fields */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Daily Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dailyCost}
                    onChange={(e) => handleInputChange('dailyCost', e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthlyCost}
                    onChange={(e) => handleInputChange('monthlyCost', e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Early Check-in Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.earlyCheckinCost}
                    onChange={(e) => handleInputChange('earlyCheckinCost', e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Late Check-out Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.lateCheckoutCost}
                    onChange={(e) => handleInputChange('lateCheckoutCost', e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  className="form-control"
                  rows="3"
                />
              </div>

              {/* Total Amount Display */}
              <div className="total-amount-display">
                <strong>Total Amount: ₹{calculateTotalCost()}</strong>
              </div>

              {/* Payments Section (only in edit mode) */}
              {isEditing && selectedBooking && (
                <div className="payments-section-modal">
                  <h4 className="payments-section-title">Payments</h4>
                  {selectedBooking.payments && selectedBooking.payments.length > 0 ? (
                    <div className="payments-list-modal">
                      {selectedBooking.payments.map((payment) => (
                        <div key={payment.id} className="payment-item-modal">
                          <div className="payment-info-modal">
                            <div className="payment-amount-modal">₹{payment.amount}</div>
                            <div className="payment-details-modal">
                              <div className="payment-mode-modal">{payment.mode}</div>
                              <div className="payment-date-modal">
                                {toLocalDateTimeString(new Date(payment.createdAt))}
                              </div>
                            </div>
                          </div>
                          <div className="payment-actions-modal">
                            <button
                              type="button"
                              className="edit-payment-btn-modal"
                              onClick={() => handleEditPayment(payment)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeletePayment(payment.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-payments-modal">No payments recorded</div>
                  )}
                  <div className="add-payment-section-modal">
                    <button
                      type="button"
                      className="add-payment-btn-modal"
                      onClick={() => {
                        setShowPaymentModal(true);
                        setIsEditingPayment(false);
                        setEditingPaymentId(null);
                        setPaymentData({
                          amount: '',
                          mode: '',
                          createdAt: new Date(),
                          paymentScreenshotUrl: ''
                        });
                      }}
                    >
                      + Add Payment
                    </button>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowBookingModal(false);
                  setIsEditing(false);
                  setSelectedBooking(null);
                  resetForm();
                }}>
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
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content payment-modal">
            <div className="modal-header">
              <h3>{isEditingPayment ? 'Edit Payment' : 'Add Payment'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowPaymentModal(false);
                  setIsEditingPayment(false);
                  setEditingPaymentId(null);
                  setPaymentData({
                    amount: '',
                    mode: '',
                    createdAt: new Date(),
                    paymentScreenshotUrl: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddPayment} className="payment-form">
              <div className="form-group">
                <label className="form-label">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode *</label>
                <select
                  value={paymentData.mode}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, mode: e.target.value }))}
                  className="form-control"
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date *</label>
                <input
                  type="datetime-local"
                  value={toLocalDateTimeString(paymentData.createdAt)}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, createdAt: new Date(e.target.value) }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPaymentScreenshot}
                  className="form-control"
                />
                {paymentData.paymentScreenshotUrl && (
                  <div className="uploaded-screenshot">
                    <img 
                      src={paymentData.paymentScreenshotUrl} 
                      alt="Payment Screenshot"
                      onClick={() => handleViewImage(paymentData.paymentScreenshotUrl, 'Payment Screenshot')}
                      className="screenshot-preview"
                    />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowPaymentModal(false);
                  setIsEditingPayment(false);
                  setEditingPaymentId(null);
                  setPaymentData({
                    amount: '',
                    mode: '',
                    createdAt: new Date(),
                    paymentScreenshotUrl: ''
                  });
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

      {/* Image Modal */}
      {showImageModal && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>{selectedImageTitle}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowImageModal(false)}
              >
                ×
              </button>
            </div>
            <div className="image-modal-content">
              <img src={selectedImageUrl} alt={selectedImageTitle} className="modal-image" />
            </div>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      {showConflictModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Booking Conflict</h3>
              <button 
                className="modal-close"
                onClick={() => setShowConflictModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{conflictMessage}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={() => setShowConflictModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingScreen;