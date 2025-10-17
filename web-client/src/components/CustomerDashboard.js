import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import './CustomerDashboard.css';

const CustomerDashboard = ({ customer, onLogout, onShowRooms, refreshTrigger }) => {
  const [bookings, setBookings] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [uploadingIdProof, setUploadingIdProof] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomerData = useCallback(async () => {
    if (!customer || !customer.phoneNumber) {
      console.log('Customer or phoneNumber not available:', customer);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('customerToken');
    if (!token) {
      console.log('No customer token found, redirecting to login...');
      if (onLogout) {
        onLogout();
      }
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      console.log('Fetching data for customer:', customer.phoneNumber);
      console.log('Current token:', localStorage.getItem('customerToken'));
      console.log('Customer data:', customer);
      
      // Fetch bookings - try direct fetch first
      console.log('Trying direct fetch request...');
      const directResponse = await fetch('http://localhost:8082/api/v1/customer/bookings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Direct fetch response status:', directResponse.status);
      console.log('Direct fetch response headers:', directResponse.headers);
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('Direct fetch data:', directData);
        setBookings(directData || []);
      } else {
        console.log('Direct fetch failed, trying axios...');
        const bookingsResponse = await api.get('/customer/bookings');
        console.log('Bookings fetched:', bookingsResponse.data);
        setBookings(bookingsResponse.data || []);
      }

      // Fetch booking requests
      const requestsResponse = await api.get(`/booking-requests/customer/${customer.phoneNumber}`);
      console.log('Booking requests fetched:', requestsResponse.data);
      setBookingRequests(requestsResponse.data || []);
      
    } catch (error) {
      console.error('Error fetching customer data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Only clear auth for actual auth errors
      if (error.response?.status === 401) {
        console.log('Authentication error, clearing localStorage...');
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerData');
        if (onLogout) {
          onLogout();
        }
      } else {
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           `Unable to load data (${error.response?.status || 'Network Error'}). Please try again.`;
        setError(errorMessage);
        setBookings([]);
        setBookingRequests([]);
      }
    } finally {
      setLoading(false);
    }
  }, [customer, onLogout]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      console.log('Refresh trigger detected, refetching customer data...');
      fetchCustomerData();
    }
  }, [refreshTrigger, fetchCustomerData]);

  const previewInvoice = async (bookingId) => {
    try {
      console.log('Previewing invoice for booking:', bookingId);
      console.log('Current token:', localStorage.getItem('customerToken'));
      
      const response = await api.get(`/invoices/${bookingId}/preview`);
      
      console.log('Invoice preview response:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataLength: response.data?.length || 'unknown'
      });
      
      if (response.data) {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(response.data);
        newWindow.document.close();
        console.log('Invoice preview opened successfully');
      } else {
        console.error('Empty preview response');
        alert('Invoice preview is empty. Please try again.');
      }
    } catch (error) {
      console.error('Error previewing invoice:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      alert(`Failed to preview invoice: ${error.message}. Please try again.`);
    }
  };

  const downloadInvoice = async (bookingId) => {
    try {
      console.log('Downloading invoice for booking:', bookingId);
      console.log('Current token:', localStorage.getItem('customerToken'));
      
      // Get the HTML preview content and download it as HTML
      const response = await api.get(`/invoices/${bookingId}/preview`);
      
      console.log('Invoice preview response:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataLength: response.data?.length || 'unknown'
      });
      
      if (response.data) {
        // Create a blob with the HTML content
        const blob = new Blob([response.data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${bookingId}.html`);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'NEW': { text: 'New', class: 'status-new' },
      'PENDING': { text: 'Pending', class: 'status-pending' },
      'CONFIRMED': { text: 'Confirmed', class: 'status-confirmed' },
      'CANCELLED': { text: 'Cancelled', class: 'status-cancelled' },
      'CHECKEDOUT': { text: 'Checked Out', class: 'status-checkedout' },
      'CHECKEDIN': { text: 'Checked In', class: 'status-checkedin' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getRequestStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { text: 'Pending', class: 'status-pending' },
      'APPROVED': { text: 'Approved', class: 'status-confirmed' },
      'REJECTED': { text: 'Rejected', class: 'status-cancelled' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const handleIdProofUpload = async (e) => {
    setUploadingIdProof(true);
    try {
      alert('❌ Access Denied\n\nCustomers cannot upload files directly to Google Drive. Please contact the caretaker or owner to upload your ID proofs.');
    } finally {
      setUploadingIdProof(false);
      e.target.value = '';
    }
  };

  if (loading || !customer) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <div className="container">
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button 
                className="retry-btn"
                onClick={() => fetchCustomerData()}
              >
                🔄 Retry
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="customer-header">
        <div className="container">
          <div className="header-content">
            <div className="header-info">
              <h1>Welcome back, {customer.name}!</h1>
              <p>Manage your bookings and requests</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={onShowRooms}>
                View Rooms
              </button>
              <button className="btn btn-outline" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-section">
        <div className="container">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">📅</div>
              <div className="card-content">
                <h3>Total Bookings</h3>
                <p className="card-number">{bookings.length}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">📋</div>
              <div className="card-content">
                <h3>Booking Requests</h3>
                <p className="card-number">{bookingRequests.length}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <h3>Confirmed</h3>
                <p className="card-number">{bookings.filter(b => b.bookingStatus === 'CONFIRMED').length}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">⏳</div>
              <div className="card-content">
                <h3>Pending</h3>
                <p className="card-number">{bookingRequests.filter(r => r.status === 'PENDING').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <div className="dashboard-tabs">
            <button 
              className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              My Bookings
            </button>
            <button 
              className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              My Requests
            </button>
            <button 
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              My Profile
            </button>
          </div>

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="bookings-section">
              <h2>My Bookings</h2>
              
              {bookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No bookings yet</h3>
                  <p>You don't have any confirmed bookings yet. Start by browsing our rooms!</p>
                  <button className="btn btn-primary" onClick={onShowRooms}>
                    Browse Rooms
                  </button>
                </div>
              ) : (
                <div className="bookings-list">
                  {bookings.map(booking => (
                    <div key={booking.id} className="booking-card">
                      <div className="booking-header">
                        <h3>Booking #{booking.id}</h3>
                        {getStatusBadge(booking.bookingStatus)}
                      </div>
                      
                      <div className="booking-details">
                        <div className="detail-row">
                          <span className="label">Room:</span>
                          <span className="value">Room {booking.roomId}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Check-in:</span>
                          <span className="value">{formatDate(booking.checkInDate)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Check-out:</span>
                          <span className="value">{formatDate(booking.checkOutDate)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Duration:</span>
                          <span className="value">{booking.bookingDurationType}</span>
                        </div>
                        {(() => {
                          const breakdown = calculatePaymentBreakdown(booking);
                          return (
                            <>
                              <div className="detail-row">
                                <span className="label">Total Amount:</span>
                                <span className="value">₹{breakdown.totalAmount.toFixed(2)}</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Total Paid:</span>
                                <span className="value" style={{ color: '#28a745' }}>₹{breakdown.totalPaid.toFixed(2)}</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Due Amount:</span>
                                <span className="value" style={{ 
                                  color: breakdown.dueAmount > 0 ? '#dc3545' : '#28a745',
                                  fontWeight: 'bold'
                                }}>
                                  ₹{breakdown.dueAmount.toFixed(2)}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Payment Count:</span>
                                <span className="value">{breakdown.paymentCount} payment(s)</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      
                      <div className="booking-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => previewInvoice(booking.id)}
                          style={{ marginRight: '10px' }}
                        >
                          👁️ Preview Invoice
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => downloadInvoice(booking.id)}
                        >
                          📄 Download Invoice (HTML)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="requests-section">
              <div className="requests-header">
                <h2>My Booking Requests</h2>
                <button 
                  className="refresh-btn"
                  onClick={fetchCustomerData}
                  title="Refresh data"
                >
                  🔄 Refresh
                </button>
              </div>
              
              {bookingRequests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No booking requests yet</h3>
                  <p>You haven't submitted any booking requests yet. Start by browsing our rooms!</p>
                  <button className="btn btn-primary" onClick={onShowRooms}>
                    Browse Rooms
                  </button>
                </div>
              ) : (
                <div className="requests-list">
                  {bookingRequests.map(request => (
                    <div key={request.id} className="request-card">
                      <div className="request-header">
                        <h3>Room {request.roomId}</h3>
                        {getRequestStatusBadge(request.status)}
                      </div>
                      
                      <div className="request-details">
                        <div className="detail-row">
                          <span className="label">Check-in:</span>
                          <span className="value">{formatDate(request.checkInDate)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Check-out:</span>
                          <span className="value">{formatDate(request.checkOutDate)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Duration:</span>
                          <span className="value">{request.bookingDurationType}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Total Amount:</span>
                          <span className="value">₹{request.totalAmount}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Submitted:</span>
                          <span className="value">{formatDate(request.createdAt)}</span>
                        </div>
                        {request.remarks && (
                          <div className="detail-row">
                            <span className="label">Remarks:</span>
                            <span className="value">{request.remarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <h2>My Profile</h2>
              
              <div className="profile-card">
                <div className="profile-info">
                  <div className="info-row">
                    <span className="label">Name:</span>
                    <span className="value">{customer.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone Number:</span>
                    <span className="value">{customer.phoneNumber}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{customer.email || 'Not provided'}</span>
                  </div>
                </div>
                
                <div className="profile-actions">
                  <h3>ID Proof Documents</h3>
                  <p>Contact the caretaker or owner to upload your ID proof documents.</p>
                  
                  <div className="upload-section">
                    <input
                      type="file"
                      id="idProofUpload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleIdProofUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="idProofUpload" className="upload-btn">
                      {uploadingIdProof ? 'Uploading...' : '📄 Upload ID Proof'}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
