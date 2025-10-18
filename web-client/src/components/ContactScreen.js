import React, { useState, useEffect } from 'react';
import api from '../config/api';

const ContactScreen = () => {
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
    remarks: ''
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const [expandedCustomers, setExpandedCustomers] = useState(new Set());
  const [customerBookings, setCustomerBookings] = useState({});
  const [loadingBookings, setLoadingBookings] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customer');
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBookings = async (phoneNumber) => {
    if (customerBookings[phoneNumber]) {
      return; // Already fetched
    }

    setLoadingBookings(prev => ({ ...prev, [phoneNumber]: true }));
    
    try {
      const response = await api.get(`/bookings/customer/${phoneNumber}`);
      setCustomerBookings(prev => ({
        ...prev,
        [phoneNumber]: Array.isArray(response.data) ? response.data : []
      }));
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      setCustomerBookings(prev => ({
        ...prev,
        [phoneNumber]: []
      }));
    } finally {
      setLoadingBookings(prev => ({ ...prev, [phoneNumber]: false }));
    }
  };

  // Filter customers based on search term
  const filteredCustomers = (customers || []).filter(customer => {
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
        alert('Customer updated successfully!');
      } else {
        await api.post('/auth/customer/register', formData);
        alert('Customer added successfully!');
      }
      
      setShowModal(false);
      setIsEditing(false);
      setSelectedCustomer(null);
      setFormData({ name: '', phoneNumber: '', additionalPhoneNumber: '', photoIdProofUrl: '', remarks: '' });
      fetchCustomers();
    } catch (error) {
      console.error('Error adding/updating customer:', error);
      alert('Error adding/updating customer. Please try again.');
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customer/${customerId}`);
        fetchCustomers();
        alert('Customer deleted successfully!');
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer. Please try again.');
      }
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

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" is not a supported format. Please upload an image (JPEG, PNG, GIF) or PDF file.`);
        return;
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
      alert('Error uploading ID proofs. Please try again.');
    }
  };

  const handleUploadIdProof = async (customer) => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload an image (JPEG, PNG, GIF) or PDF file');
        return;
      }

      try {
        // Create FormData for file upload
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await api.post(`/upload/photo-id-proof`, uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          params: {
            phoneNumber: customer.phoneNumber
          }
        });

        if (response.data.success) {
          alert('ID Proof uploaded successfully!');
          fetchCustomers(); // Refresh the customer list
        } else {
          alert('Error uploading ID proof: ' + response.data.message);
        }
      } catch (error) {
        console.error('Error uploading ID proof:', error);
        alert('Error uploading ID proof. Please try again.');
      }
    };
    input.click();
  };


  const handleViewImage = (imageUrl, title) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageTitle(title);
    setShowImageModal(true);
  };

  const toggleCustomerExpansion = async (phoneNumber) => {
    const newExpanded = new Set(expandedCustomers);
    if (expandedCustomers.has(phoneNumber)) {
      newExpanded.delete(phoneNumber);
    } else {
      newExpanded.add(phoneNumber);
      // Fetch bookings when expanding
      await fetchCustomerBookings(phoneNumber);
    }
    setExpandedCustomers(newExpanded);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="contact-screen">
      <div className="page-header">
        <h1>Customer Management</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-container" style={{ marginBottom: '20px' }}>
        <div className="search-box" style={{ position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by name, phone number, or additional phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '40px' }}
          />
          <span style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#666',
            fontSize: '16px'
          }}>
            🔍
          </span>
        </div>
        {searchTerm && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            Showing {filteredCustomers.length} of {(customers || []).length} customers
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Customers</h3>
        </div>
        <div className="card-body">
          {filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <p>
                {searchTerm 
                  ? `No customers found matching "${searchTerm}". Try a different search term.` 
                  : 'No customers found. Add your first customer!'
                }
              </p>
              {searchTerm && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setSearchTerm('')}
                  style={{ marginTop: '10px' }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Additional Phone</th>
                    <th>ID Proof 1</th>
                    <th>ID Proof 2</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(customer => (
                    <React.Fragment key={customer.phoneNumber}>
                      <tr 
                        style={{ 
                          backgroundColor: !customer.idProofSubmitted ? '#ffe6e6' : 'transparent',
                          opacity: !customer.idProofSubmitted ? 0.9 : 1
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => toggleCustomerExpansion(customer.phoneNumber)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#007bff',
                                padding: '0',
                                marginRight: '5px'
                              }}
                              title="Click to view booking history"
                            >
                              {expandedCustomers.has(customer.phoneNumber) ? '▼' : '▶'}
                            </button>
                            <span style={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => toggleCustomerExpansion(customer.phoneNumber)}>
                              {customer.name}
                            </span>
                          </div>
                        </td>
                      <td>{customer.phoneNumber}</td>
                      <td>{customer.additionalPhoneNumber || 'N/A'}</td>
                      <td>
                        {customer.idProofSubmitted && (customer.photoIdProofUrl || (customer.idProofUrls && customer.idProofUrls[0])) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={customer.photoIdProofUrl || customer.idProofUrls[0]} 
                              alt="ID Proof 1 Preview" 
                              style={{ 
                                width: '40px', 
                                height: '30px', 
                                objectFit: 'cover', 
                                border: '1px solid #ccc', 
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleViewImage(
                                customer.photoIdProofUrl || customer.idProofUrls[0], 
                                'ID Proof 1'
                              )}
                              title="Click to view full size"
                            />
                            <button 
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleViewImage(
                                customer.photoIdProofUrl || customer.idProofUrls[0], 
                                'ID Proof 1'
                              )}
                              style={{ fontSize: '8px', padding: '1px 4px' }}
                            >
                              👁️
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleEditCustomer(customer)}
                            style={{ fontSize: '10px', padding: '2px 6px' }}
                          >
                            📤 Upload
                          </button>
                        )}
                      </td>
                      <td>
                        {customer.idProofSubmitted && customer.idProofUrls && customer.idProofUrls[1] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={customer.idProofUrls[1]} 
                              alt="ID Proof 2 Preview" 
                              style={{ 
                                width: '40px', 
                                height: '30px', 
                                objectFit: 'cover', 
                                border: '1px solid #ccc', 
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleViewImage(customer.idProofUrls[1], 'ID Proof 2')}
                              title="Click to view full size"
                            />
                            <button 
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleViewImage(customer.idProofUrls[1], 'ID Proof 2')}
                              style={{ fontSize: '8px', padding: '1px 4px' }}
                            >
                              👁️
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleEditCustomer(customer)}
                            style={{ fontSize: '10px', padding: '2px 6px' }}
                          >
                            📤 Upload
                          </button>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {customer.remarks || 'N/A'}
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(customer.phoneNumber)}
                          style={{ marginLeft: '5px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    
                    {/* Booking History Dropdown */}
                    {expandedCustomers.has(customer.phoneNumber) && (
                      <tr>
                        <td colSpan="6" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                          <div style={{ padding: '20px', borderTop: '1px solid #dee2e6' }}>
                            <h5 style={{ margin: '0 0 15px 0', color: '#495057', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              📅 Booking History for {customer.name}
                              {loadingBookings[customer.phoneNumber] && (
                                <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                  <span className="spinner" style={{ width: '12px', height: '12px', marginRight: '5px' }}></span>
                                  Loading...
                                </span>
                              )}
                            </h5>
                            
                            {customerBookings[customer.phoneNumber] && customerBookings[customer.phoneNumber].length > 0 ? (
                              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                  {customerBookings[customer.phoneNumber].map((booking, index) => (
                                    <div 
                                      key={booking.id || index}
                                      style={{
                                        padding: '15px',
                                        backgroundColor: 'white',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div>
                                          <h6 style={{ margin: '0 0 5px 0', color: '#495057' }}>
                                            Booking #{booking.id}
                                          </h6>
                                          <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>
                                            Room: {booking.roomId} | Guests: {booking.numberOfPeople || 'N/A'}
                                          </p>
                                        </div>
                                        <span 
                                          style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            backgroundColor: getStatusColor(booking.bookingStatus)
                                          }}
                                        >
                                          {booking.bookingStatus}
                                        </span>
                                      </div>
                                      
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                                        <div>
                                          <strong>Check-in:</strong> {formatDate(booking.checkInDate)}
                                        </div>
                                        <div>
                                          <strong>Check-out:</strong> {formatDate(booking.checkOutDate)}
                                        </div>
                                        <div>
                                          <strong>Duration:</strong> {booking.bookingDurationType || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Total Amount:</strong> ₹{booking.totalAmount || '0'}
                                        </div>
                                        <div>
                                          <strong>Daily Rate:</strong> ₹{booking.dailyCost || '0'}
                                        </div>
                                        <div>
                                          <strong>Monthly Rate:</strong> ₹{booking.monthlyCost || '0'}
                                        </div>
                                        {booking.earlyCheckinCost > 0 && (
                                          <div>
                                            <strong>Early Check-in:</strong> ₹{booking.earlyCheckinCost}
                                          </div>
                                        )}
                                        {booking.lateCheckoutCost > 0 && (
                                          <div>
                                            <strong>Late Check-out:</strong> ₹{booking.lateCheckoutCost}
                                          </div>
                                        )}
                                        <div>
                                          <strong>Created:</strong> {formatDate(booking.createdAt)}
                                        </div>
                                        {booking.remarks && (
                                          <div style={{ gridColumn: '1 / -1' }}>
                                            <strong>Remarks:</strong> {booking.remarks}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              !loadingBookings[customer.phoneNumber] && (
                                <div style={{ 
                                  textAlign: 'center', 
                                  padding: '20px', 
                                  color: '#6c757d',
                                  fontStyle: 'italic'
                                }}>
                                  No bookings found for this customer.
                                </div>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="modal-close" onClick={() => {
                setShowModal(false);
                setIsEditing(false);
                setSelectedCustomer(null);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Additional Phone Number</label>
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
                  multiple
                  onChange={handleIdProofUpload}
                  id="idProofFile"
                />
                
                {/* Display uploaded ID proofs */}
                {(formData.idProofUrls && formData.idProofUrls.length > 0) || formData.photoIdProofUrl ? (
                  <div className="mt-3">
                    <small className="text-success">✓ ID Proof(s) uploaded successfully</small>
                    <div className="id-proofs-list mt-2">
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
                              title="Click to view full size"
                            />
                          </div>
                          <div style={{ flex: '1', minWidth: '0' }}>
                            <div className="id-proof-info">
                              <span className="id-proof-name" style={{ display: 'block', fontWeight: 'bold', fontSize: '12px' }}>📄 ID Proof Document</span>
                              <span className="id-proof-type" style={{ display: 'block', fontSize: '10px', color: '#666' }}>Legacy Upload</span>
                            </div>
                          </div>
                          <div className="id-proof-actions" style={{ flex: '0 0 auto' }}>
                            <button 
                              onClick={() => handleViewImage(formData.photoIdProofUrl, 'ID Proof (Legacy)')}
                              className="btn btn-sm btn-outline-success"
                              style={{ marginRight: '5px', fontSize: '10px', padding: '2px 6px' }}
                            >
                              👁️ View
                            </button>
                            <a 
                              href={formData.photoIdProofUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                              style={{ fontSize: '10px', padding: '2px 6px' }}
                            >
                              🔗 Open
                            </a>
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
                              title="Click to view full size"
                            />
                          </div>
                          <div style={{ flex: '1', minWidth: '0' }}>
                            <div className="id-proof-info">
                              <span className="id-proof-name" style={{ display: 'block', fontWeight: 'bold', fontSize: '12px' }}>📄 ID Proof #{index + 1}</span>
                              <span className="id-proof-type" style={{ display: 'block', fontSize: '10px', color: '#666' }}>Document</span>
                            </div>
                          </div>
                          <div className="id-proof-actions" style={{ flex: '0 0 auto' }}>
                            <button 
                              onClick={() => handleViewImage(url, `ID Proof ${index + 1}`)}
                              className="btn btn-sm btn-outline-success"
                              style={{ marginRight: '5px', fontSize: '10px', padding: '2px 6px' }}
                            >
                              👁️ View
                            </button>
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                              style={{ fontSize: '10px', padding: '2px 6px' }}
                            >
                              🔗 Open
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                
                <small className="form-text text-muted">
                  Upload photos or PDFs of ID proof documents (Max 10MB each). You can select multiple files.
                </small>
                
                {/* Add Additional ID Proof Button */}
                {(formData.idProofUrls && formData.idProofUrls.length > 0) || formData.photoIdProofUrl ? (
                  <div className="mt-3">
                    <button 
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const input = document.getElementById('idProofFile');
                        if (input) input.click();
                      }}
                      style={{ fontSize: '12px' }}
                    >
                      + Add Additional ID Proof
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea
                  className="form-control"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  rows="3"
                  placeholder="Any additional notes about this customer..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                  setSelectedCustomer(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
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
    </div>
  );
};

export default ContactScreen;
