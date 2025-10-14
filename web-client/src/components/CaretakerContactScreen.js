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
    remarks: ''
  });

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
      remarks: customer.remarks || ''
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
    formData.append('files', file);

    try {
      const response = await api.post(`/customer/${selectedCustomer.phoneNumber}/upload-id-proofs`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          photoIdProofUrl: response.data.fileUrl
        }));
        alert('✅ ID Proof uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading ID proof:', error);
      alert('❌ Error uploading ID proof. Please try again.');
    }
  };

  const handleUploadIdProof = (customer) => {
    setFormData({
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      additionalPhoneNumber: customer.additionalPhoneNumber || '',
      photoIdProofUrl: customer.photoIdProofUrl || '',
      remarks: customer.remarks || ''
    });
    setSelectedCustomer(customer);
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', phoneNumber: '', additionalPhoneNumber: '', photoIdProofUrl: '', remarks: '' });
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
                <label className="form-label">📄 ID Proof Document</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*,.pdf"
                  onChange={handleIdProofUpload}
                  id="idProofFile"
                />
                {formData.photoIdProofUrl && (
                  <div className="upload-success">
                    <small className="text-success">✅ ID Proof uploaded successfully</small>
                    <br />
                    <a 
                      href={formData.photoIdProofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-document-btn"
                    >
                      📄 View Uploaded Document
                    </a>
                  </div>
                )}
                <small className="form-text">
                  Upload a photo or PDF of ID proof document (Max 10MB)
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
    </div>
  );
};

export default CaretakerContactScreen;
