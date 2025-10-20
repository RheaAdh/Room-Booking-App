import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { toLocalDateTimeString, toLocalDateString } from '../utils/dateUtils';
import './CaretakerContactScreen.css';

const CaretakerContactScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    additionalPhoneNumber: '',
    photoIdProofUrl: '',
    remarks: '',
    idProofUrls: []
  });
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  
  // Booking creation states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomConfigurations, setRoomConfigurations] = useState([]);
  const [bookingFormData, setBookingFormData] = useState({
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
  const [customerBookings, setCustomerBookings] = useState({});
  const [loadingBookings, setLoadingBookings] = useState({});

  useEffect(() => {
    fetchCustomers();
    fetchBookingData();
  }, []);

  const fetchBookingData = async () => {
    try {
      const [roomsRes, roomConfigsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/room-configurations')
      ]);
      setRooms(roomsRes.data);
      setRoomConfigurations(roomConfigsRes.data);
    } catch (error) {
      console.error('Error fetching booking data:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customer');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const name = customer.name?.toLowerCase() || '';
    const phoneNumber = customer.phoneNumber?.toLowerCase() || '';
    const additionalPhoneNumber = customer.additionalPhoneNumber?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    return name.includes(searchLower) || 
           phoneNumber.includes(searchLower) || 
           additionalPhoneNumber.includes(searchLower);
  });

  const handleEditCustomer = (customer) => {
    setFormData({
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      additionalPhoneNumber: customer.additionalPhoneNumber || '',
      photoIdProofUrl: customer.photoIdProofUrl || '',
      remarks: customer.remarks || '',
      idProofUrls: customer.idProofUrls || []
    });
    setSelectedCustomer(customer);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedCustomer) {
        await api.put(`/customer/${selectedCustomer.phoneNumber}`, formData);
        alert('✅ Customer updated successfully!');
      } else {
        await api.post('/customer', formData);
        alert('✅ Customer added successfully!');
      }
      
      setShowModal(false);
      setIsEditing(false);
      setSelectedCustomer(null);
      setFormData({ name: '', phoneNumber: '', additionalPhoneNumber: '', photoIdProofUrl: '', remarks: '' });
      fetchCustomers();
    } catch (error) {
      console.error('Error adding/updating customer:', error);
      alert('❌ Error adding/updating customer. Please try again.');
    }
  };

  const handleIdProofUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate each file
    for (const file of files) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }

      // More flexible file type validation for mobile cameras
      const allowedTypes = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/gif', 
        'image/webp', // Mobile cameras often use WebP
        'application/pdf',
        'image/heic', // iOS camera format
        'image/heif'  // iOS camera format
      ];
      
      // Check if file type is allowed or if it's an image (for mobile camera compatibility)
      const isAllowedType = allowedTypes.includes(file.type);
      const isImageFile = file.type.startsWith('image/');
      const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name);
      
      if (!isAllowedType && !(isImageFile && hasImageExtension)) {
        console.warn(`File type "${file.type}" not in allowed list, but proceeding as it appears to be an image file`);
        // Don't block the upload, just log a warning
      }
    }

    try {
      // Create FormData for multiple file upload
      const uploadFormData = new FormData();
      files.forEach(file => {
        uploadFormData.append('files', file);
      });

      // Upload to backend - we need a phone number for the upload
      // For new customers, we'll use a temporary phone number
      const phoneNumber = selectedCustomer?.phoneNumber || formData.phoneNumber || 'temp-' + Date.now();
      
      const response = await api.post(`/upload/multiple-id-proofs`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          phoneNumber: phoneNumber
        }
      });

      if (response.data.success) {
        // Update form data with the uploaded URLs
        setFormData(prev => ({
          ...prev,
          idProofUrls: [...(prev.idProofUrls || []), ...response.data.uploadedUrls]
        }));

        alert(`Successfully uploaded ${response.data.uploadedUrls.length} ID proof(s)!`);
      } else {
        alert('Error uploading ID proofs: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error uploading ID proofs:', error);
      
      // Provide more specific error messages for mobile users
      let errorMessage = 'Error uploading ID proofs. Please try again.';
      
      if (error.message && error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message && error.message.includes('413')) {
        errorMessage = 'File too large. Please compress the image or try a smaller file.';
      } else if (error.message && error.message.includes('415')) {
        errorMessage = 'Unsupported file format. Please try taking a new photo or selecting a different image.';
      }
      
      alert(errorMessage);
    }
  };

  const handleViewImage = (imageUrl, title) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageTitle(title);
    setShowImageModal(true);
  };

  const handleUploadIdProof = (customer) => {
    setFormData({
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      additionalPhoneNumber: customer.additionalPhoneNumber || '',
      photoIdProofUrl: customer.photoIdProofUrl || '',
      remarks: customer.remarks || '',
      idProofUrls: customer.idProofUrls || []
    });
    setSelectedCustomer(customer);
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', phoneNumber: '', additionalPhoneNumber: '', photoIdProofUrl: '', remarks: '', idProofUrls: [] });
  };

  const fetchCustomerBookings = async (phoneNumber) => {
    if (customerBookings[phoneNumber]) return; // Already fetched
    
    setLoadingBookings(prev => ({ ...prev, [phoneNumber]: true }));
    try {
      const response = await api.get(`/bookings/customer/${phoneNumber}`);
      setCustomerBookings(prev => ({ ...prev, [phoneNumber]: response.data }));
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      setCustomerBookings(prev => ({ ...prev, [phoneNumber]: [] }));
    } finally {
      setLoadingBookings(prev => ({ ...prev, [phoneNumber]: false }));
    }
  };

  const handleCreateBooking = (customer) => {
    setBookingFormData({
      customerPhoneNumber: customer.phoneNumber,
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
    setShowBookingModal(true);
  };

  const handleBookingInputChange = (field, value) => {
    setBookingFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value
      };
      
      // Auto-populate costs when room or number of people changes
      if (field === 'roomId' || field === 'numberOfPeople') {
        const roomConfig = getRoomConfiguration(newFormData.roomId, newFormData.numberOfPeople);
        if (roomConfig) {
          newFormData.dailyCost = roomConfig.dailyCost;
          newFormData.monthlyCost = roomConfig.monthlyCost;
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

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const totalCost = calculateTotalCost(bookingFormData);
      
      const bookingPayload = {
        ...bookingFormData,
        roomId: parseInt(bookingFormData.roomId),
        checkInDate: toLocalDateTimeString(bookingFormData.checkInDate),
        checkOutDate: toLocalDateTimeString(bookingFormData.checkOutDate),
        dailyCost: parseFloat(bookingFormData.dailyCost) || 0,
        monthlyCost: parseFloat(bookingFormData.monthlyCost) || 0,
        earlyCheckinCost: parseFloat(bookingFormData.earlyCheckinCost) || 0,
        totalAmount: totalCost
      };
      
      await api.post('/bookings', bookingPayload);
      alert(`✅ Booking created successfully! Total Amount: ₹${totalCost.toFixed(2)}`);
      
      setShowBookingModal(false);
      resetBookingForm();
      // Refresh customer bookings
      if (bookingFormData.customerPhoneNumber) {
        setCustomerBookings(prev => ({ ...prev, [bookingFormData.customerPhoneNumber]: undefined }));
        fetchCustomerBookings(bookingFormData.customerPhoneNumber);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('❌ Error creating booking. Please try again.');
    }
  };

  const resetBookingForm = () => {
    setBookingFormData({
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
  };

  const downloadInvoicePdf = async (bookingId) => {
    try {
      // Open the invoice URL directly in a new tab
      const invoiceUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8082'}/api/v1/invoices/${bookingId}/download`;
      window.open(invoiceUrl, '_blank');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('❌ Error downloading invoice. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="caretaker-loading">
        <div className="loading-spinner"></div>
        <p>Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="caretaker-contacts">

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        {searchTerm && (
          <div className="search-results">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        )}
      </div>

      {/* Add Customer Button */}
      <div className="add-customer-section">
        <button 
          className="add-customer-btn"
          onClick={() => {
            resetForm();
            setIsEditing(false);
            setSelectedCustomer(null);
            setShowModal(true);
          }}
        >
          ➕ Add New Customer
        </button>
      </div>

      {/* Contacts List */}
      <div className="contacts-list">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => {
            // Check if customer has any ID proof (single or multiple)
            const hasIdProof = customer.photoIdProofUrl || 
                              (customer.idProofUrls && customer.idProofUrls.length > 0);
            
            return (
              <div 
                key={customer.phoneNumber} 
                className={`contact-card ${!hasIdProof ? 'missing-id-proof' : ''}`}
              >
                <div className="contact-header">
                  <div className="contact-info">
                    <h3 className="contact-name">{customer.name}</h3>
                    <p className="contact-phone">{customer.phoneNumber}</p>
                    {customer.additionalPhoneNumber && (
                      <p className="contact-phone-secondary">{customer.additionalPhoneNumber}</p>
                    )}
                  </div>
                  <div className="contact-status">
                    {hasIdProof ? (
                      <span className="status-badge verified">✅ Verified</span>
                    ) : (
                      <span className="status-badge pending">⚠️ ID Required</span>
                    )}
                  </div>
                </div>
              
              {customer.remarks && (
                <div className="contact-remarks">
                  <p><strong>Remarks:</strong> {customer.remarks}</p>
                </div>
              )}

              <div className="contact-actions">
                <button 
                  className="action-btn edit-btn"
                  onClick={() => handleEditCustomer(customer)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="action-btn booking-btn"
                  onClick={() => handleCreateBooking(customer)}
                >
                  📅 Create Booking
                </button>
                <button 
                  className="action-btn history-btn"
                  onClick={() => fetchCustomerBookings(customer.phoneNumber)}
                >
                  📋 View Bookings
                </button>
              </div>

              {/* Customer Bookings Section */}
              {customerBookings[customer.phoneNumber] !== undefined && (
                <div className="customer-bookings">
                  <h4>📋 Booking History</h4>
                  {loadingBookings[customer.phoneNumber] ? (
                    <div className="loading-bookings">Loading bookings...</div>
                  ) : customerBookings[customer.phoneNumber] && customerBookings[customer.phoneNumber].length > 0 ? (
                    <div className="bookings-list">
                      {customerBookings[customer.phoneNumber].map((booking) => {
                        const room = rooms.find(r => r.id === booking.roomId);
                        return (
                          <div key={booking.id} className="booking-item">
                            <div className="booking-info">
                              <div className="booking-details">
                                <span className="booking-room">Room {room?.roomNumber || booking.roomId}</span>
                                <span className="booking-dates">
                                  {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                                </span>
                                <span className="booking-amount">₹{booking.totalAmount}</span>
                                <span className={`booking-status ${booking.bookingStatus?.toLowerCase()}`}>
                                  {booking.bookingStatus}
                                </span>
                              </div>
                              <div className="booking-actions">
                                <button 
                                  className="download-invoice-btn"
                                  onClick={() => downloadInvoicePdf(booking.id)}
                                >
                                  📥 Download Invoice
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-bookings">No bookings found for this customer.</div>
                  )}
                </div>
              )}
            </div>
            );
          })
        ) : (
          <div className="no-contacts">
            <div className="no-contacts-icon">👥</div>
            <h3>No contacts found</h3>
            <p>Try adjusting your search or add a new customer.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                  setSelectedCustomer(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">👤 Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">📱 Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  required
                  placeholder="Enter phone number"
                />
              </div>
              
              
              <div className="form-group">
                <label className="form-label">📱 Additional Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.additionalPhoneNumber}
                  onChange={(e) => setFormData({...formData, additionalPhoneNumber: e.target.value})}
                  placeholder="Optional secondary phone number"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">📄 ID Proof Documents</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*,.pdf"
                  capture="environment"
                  onChange={handleIdProofUpload}
                  id="idProofFile"
                  multiple
                />
                
                {/* Legacy single ID proof */}
                {formData.photoIdProofUrl && (
                  <div className="id-proof-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ flex: '0 0 auto' }}>
                      <img 
                        src={formData.photoIdProofUrl} 
                        alt="ID Proof Preview" 
                        style={{ 
                          width: '60px', 
                          height: '45px', 
                          objectFit: 'cover', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleViewImage(formData.photoIdProofUrl, 'ID Proof (Legacy)')}
                        onError={(e) => {
                          console.error('Legacy ID proof image failed to load:', formData.photoIdProofUrl);
                          e.target.style.display = 'none';
                        }}
                        title="Click to view full size"
                      />
                    </div>
                    <div style={{ flex: '1', minWidth: '0' }}>
                      <div className="id-proof-info">
                        <span className="id-proof-name" style={{ display: 'block', fontWeight: 'bold', fontSize: '12px' }}>📄 ID Proof Document</span>
                        <span className="id-proof-type" style={{ display: 'block', fontSize: '10px', color: '#666' }}>Legacy Upload</span>
                      </div>
                    </div>
                    <div style={{ flex: '0 0 auto', display: 'flex', gap: '4px' }}>
                      <button 
                        type="button"
                        onClick={() => handleViewImage(formData.photoIdProofUrl, 'ID Proof (Legacy)')}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '10px', 
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
                        onClick={() => setFormData({...formData, photoIdProofUrl: ''})}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '10px', 
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
                
                {/* Multiple ID proofs */}
                {formData.idProofUrls && formData.idProofUrls.map((url, index) => (
                  <div key={index} className="id-proof-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ flex: '0 0 auto' }}>
                      <img 
                        src={url} 
                        alt={`ID Proof ${index + 1} Preview`} 
                        style={{ 
                          width: '60px', 
                          height: '45px', 
                          objectFit: 'cover', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleViewImage(url, `ID Proof ${index + 1}`)}
                        onError={(e) => {
                          console.error('Multiple ID proof image failed to load:', url);
                          e.target.style.display = 'none';
                        }}
                        title="Click to view full size"
                      />
                    </div>
                    <div style={{ flex: '1', minWidth: '0' }}>
                      <div className="id-proof-info">
                        <span className="id-proof-name" style={{ display: 'block', fontWeight: 'bold', fontSize: '12px' }}>📄 ID Proof #{index + 1}</span>
                        <span className="id-proof-type" style={{ display: 'block', fontSize: '10px', color: '#666' }}>Document</span>
                      </div>
                    </div>
                    <div style={{ flex: '0 0 auto', display: 'flex', gap: '4px' }}>
                      <button 
                        type="button"
                        onClick={() => handleViewImage(url, `ID Proof ${index + 1}`)}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '10px', 
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
                        onClick={() => {
                          const newIdProofUrls = formData.idProofUrls.filter((_, i) => i !== index);
                          setFormData({...formData, idProofUrls: newIdProofUrls});
                        }}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '10px', 
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
                ))}
                
                <small className="form-text">
                  Upload multiple photos or PDFs of ID proof documents (Max 10MB each)
                </small>
              </div>
              
              <div className="form-group">
                <label className="form-label">📝 Remarks</label>
                <textarea
                  className="form-control"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  rows="3"
                  placeholder="Any additional notes about this customer..."
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="mobile-btn mobile-btn-secondary" 
                  onClick={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    setSelectedCustomer(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="mobile-btn mobile-btn-primary">
                  {isEditing ? '✏️ Update Customer' : '✅ Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal" style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0 }}>{selectedImageTitle}</h4>
              <button 
                onClick={() => setShowImageModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img 
                src={selectedImageUrl} 
                alt={selectedImageTitle}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh', 
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none', padding: '20px', color: '#666' }}>
                <p>❌ Failed to load image</p>
                <p>URL: {selectedImageUrl}</p>
              </div>
            </div>
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
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Booking</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowBookingModal(false);
                  resetBookingForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleBookingSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">👤 Customer</label>
                <input
                  type="text"
                  className="form-control"
                  value={customers.find(c => c.phoneNumber === bookingFormData.customerPhoneNumber)?.name || ''}
                  disabled
                />
                <small className="form-text">Customer: {bookingFormData.customerPhoneNumber}</small>
              </div>

              <div className="form-group">
                <label className="form-label">🏠 Room</label>
                <select
                  className="form-control"
                  value={bookingFormData.roomId}
                  onChange={(e) => handleBookingInputChange('roomId', e.target.value)}
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
                  value={bookingFormData.numberOfPeople}
                  onChange={(e) => handleBookingInputChange('numberOfPeople', parseInt(e.target.value))}
                  required
                  disabled={!bookingFormData.roomId}
                >
                  <option value="">{bookingFormData.roomId ? 'Select Number of People' : 'Select Room First'}</option>
                  {bookingFormData.roomId ? 
                    (() => {
                      const configs = roomConfigurations.filter(config => config.roomId === parseInt(bookingFormData.roomId));
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
                  value={toLocalDateString(bookingFormData.checkInDate)}
                  onChange={(e) => handleBookingInputChange('checkInDate', new Date(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📅 Check-out Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={toLocalDateString(bookingFormData.checkOutDate)}
                  onChange={(e) => handleBookingInputChange('checkOutDate', new Date(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📊 Booking Status</label>
                <select
                  className="form-control"
                  value={bookingFormData.bookingStatus}
                  onChange={(e) => handleBookingInputChange('bookingStatus', e.target.value)}
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
                  value={bookingFormData.bookingDurationType}
                  onChange={(e) => handleBookingInputChange('bookingDurationType', e.target.value)}
                  required
                >
                  <option value="DAILY">Daily</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              {bookingFormData.bookingDurationType === 'DAILY' && (
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
                    value={bookingFormData.dailyCost}
                    onChange={(e) => handleBookingInputChange('dailyCost', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter daily cost"
                    required
                    style={{ 
                      backgroundColor: bookingFormData.dailyCost ? '#f8f9fa' : 'white',
                      border: bookingFormData.dailyCost ? '1px solid #28a745' : '1px solid #ced4da'
                    }}
                  />
                </div>
              )}

              {bookingFormData.bookingDurationType === 'MONTHLY' && (
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
                    value={bookingFormData.monthlyCost}
                    onChange={(e) => handleBookingInputChange('monthlyCost', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter monthly cost"
                    required
                    style={{ 
                      backgroundColor: bookingFormData.monthlyCost ? '#f8f9fa' : 'white',
                      border: bookingFormData.monthlyCost ? '1px solid #28a745' : '1px solid #ced4da'
                    }}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">⏰ Early Check-in Cost (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={bookingFormData.earlyCheckinCost}
                  onChange={(e) => handleBookingInputChange('earlyCheckinCost', e.target.value)}
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
                  value={bookingFormData.lateCheckoutCost}
                  onChange={(e) => handleBookingInputChange('lateCheckoutCost', e.target.value)}
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
                    resetBookingForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="mobile-btn mobile-btn-primary">
                  ✅ Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaretakerContactScreen;
