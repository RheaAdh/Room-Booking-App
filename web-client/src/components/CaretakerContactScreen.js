import React, { useState, useEffect } from 'react';
import api from '../config/api';
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

  useEffect(() => {
    fetchCustomers();
  }, []);

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
        await api.post('/auth/customer/register', formData);
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
      {/* Header */}
      <div className="contacts-header">
        <h1>👥 Contacts</h1>
        <p>Manage customer information</p>
      </div>

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
          filteredCustomers.map(customer => (
            <div 
              key={customer.phoneNumber} 
              className={`contact-card ${!customer.photoIdProofUrl ? 'missing-id-proof' : ''}`}
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
                  {customer.photoIdProofUrl ? (
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
                {customer.photoIdProofUrl ? (
                  <a 
                    href={customer.photoIdProofUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-btn view-btn"
                  >
                    📄 View ID
                  </a>
                ) : (
                  <button 
                    className="action-btn upload-btn"
                    onClick={() => handleUploadIdProof(customer)}
                  >
                    📤 Upload ID
                  </button>
                )}
              </div>
            </div>
          ))
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
    </div>
  );
};

export default CaretakerContactScreen;
