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
      
      const response = await api.post(`/customer/${phoneNumber}/upload-id-proofs`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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

        await api.post(`/customer/${customer.phoneNumber}/upload-photo-id`, uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        alert('ID Proof uploaded successfully!');
        fetchCustomers(); // Refresh the customer list
      } catch (error) {
        console.error('Error uploading ID proof:', error);
        alert('Error uploading ID proof. Please try again.');
      }
    };
    input.click();
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
            Showing {filteredCustomers.length} of {customers.length} customers
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
                    <th>Remarks</th>
                    <th>ID Proof</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(customer => (
                    <tr 
                      key={customer.phoneNumber}
                      style={{ 
                        backgroundColor: !customer.photoIdProofUrl ? '#ffe6e6' : 'transparent',
                        opacity: !customer.photoIdProofUrl ? 0.9 : 1
                      }}
                    >
                      <td>{customer.name}</td>
                      <td>{customer.phoneNumber}</td>
                      <td>{customer.additionalPhoneNumber || 'N/A'}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {customer.remarks || 'N/A'}
                      </td>
                      <td>
                        {customer.photoIdProofUrl ? (
                          <a 
                            href={customer.photoIdProofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-success"
                            style={{ fontSize: '12px', padding: '2px 8px' }}
                          >
                            📄 View ID
                          </a>
                        ) : (
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleUploadIdProof(customer)}
                            style={{ fontSize: '12px', padding: '2px 8px' }}
                          >
                            📤 Upload
                          </button>
                        )}
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
                        <div className="id-proof-item">
                          <div className="id-proof-info">
                            <span className="id-proof-name">📄 ID Proof Document</span>
                            <span className="id-proof-type">Legacy Upload</span>
                          </div>
                          <div className="id-proof-actions">
                            <a 
                              href={formData.photoIdProofUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-success"
                            >
                              👁️ View
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {/* Multiple ID proofs */}
                      {formData.idProofUrls && formData.idProofUrls.map((url, index) => (
                        <div key={index} className="id-proof-item">
                          <div className="id-proof-info">
                            <span className="id-proof-name">📄 ID Proof #{index + 1}</span>
                            <span className="id-proof-type">Document</span>
                          </div>
                          <div className="id-proof-actions">
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-success"
                            >
                              👁️ View
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
    </div>
  );
};

export default ContactScreen;
