import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './BookingRequestsScreen.css';

const BookingRequestsScreen = () => {
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchBookingRequests();
  }, []);

  const fetchBookingRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/booking-requests');
      setBookingRequests(response.data);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await api.put(`/booking-requests/${requestId}/approve`);
      alert('✅ Booking request approved successfully!');
      fetchBookingRequests();
    } catch (error) {
      console.error('Error approving booking request:', error);
      alert('❌ Failed to approve booking request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.put(`/booking-requests/${requestId}/reject`);
      alert('✅ Booking request rejected successfully!');
      fetchBookingRequests();
    } catch (error) {
      console.error('Error rejecting booking request:', error);
      alert('❌ Failed to reject booking request. Please try again.');
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { class: 'status-pending', text: 'Pending', icon: '⏳' },
      APPROVED: { class: 'status-approved', text: 'Approved', icon: '✅' },
      REJECTED: { class: 'status-rejected', text: 'Rejected', icon: '❌' }
    };
    
    const config = statusConfig[status] || { class: 'status-default', text: status, icon: '❓' };
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const filteredRequests = bookingRequests.filter(request => {
    if (filter === 'ALL') return true;
    return request.status === filter;
  });

  const getFilterCounts = () => {
    return {
      ALL: bookingRequests.length,
      PENDING: bookingRequests.filter(r => r.status === 'PENDING').length,
      APPROVED: bookingRequests.filter(r => r.status === 'APPROVED').length,
      REJECTED: bookingRequests.filter(r => r.status === 'REJECTED').length
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading booking requests...</p>
      </div>
    );
  }

  return (
    <div className="booking-requests-screen">
      <div className="header">
        <h2>📋 Booking Requests Management</h2>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{counts.PENDING}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{counts.APPROVED}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{counts.REJECTED}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All ({counts.ALL})
        </button>
        <button 
          className={`filter-btn ${filter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          Pending ({counts.PENDING})
        </button>
        <button 
          className={`filter-btn ${filter === 'APPROVED' ? 'active' : ''}`}
          onClick={() => setFilter('APPROVED')}
        >
          Approved ({counts.APPROVED})
        </button>
        <button 
          className={`filter-btn ${filter === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setFilter('REJECTED')}
        >
          Rejected ({counts.REJECTED})
        </button>
      </div>

      <div className="requests-list">
        {filteredRequests.length === 0 ? (
          <div className="no-requests">
            <p>No booking requests found for the selected filter.</p>
          </div>
        ) : (
          filteredRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <div className="request-info">
                  <h3>Request #{request.id}</h3>
                  <p className="customer-info">
                    <strong>👤 {request.customerName}</strong> - {request.customerPhone}
                  </p>
                </div>
                <div className="request-status">
                  {getStatusBadge(request.status)}
                </div>
              </div>

              <div className="request-details">
                <div className="detail-row">
                  <span className="detail-label">🏠 Room:</span>
                  <span className="detail-value">Room {request.roomId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📅 Check-in:</span>
                  <span className="detail-value">
                    {new Date(request.checkInDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📅 Check-out:</span>
                  <span className="detail-value">
                    {new Date(request.checkOutDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">💰 Total Amount:</span>
                  <span className="detail-value">₹{request.totalAmount}</span>
                </div>
                {request.remarks && (
                  <div className="detail-row">
                    <span className="detail-label">📝 Remarks:</span>
                    <span className="detail-value">{request.remarks}</span>
                  </div>
                )}
              </div>

              <div className="request-actions">
                <button 
                  className="action-btn view-btn"
                  onClick={() => handleViewDetails(request)}
                >
                  👁️ View Details
                </button>
                
                {request.status === 'PENDING' && (
                  <>
                    <button 
                      className="action-btn approve-btn"
                      onClick={() => handleApproveRequest(request.id)}
                    >
                      ✅ Approve
                    </button>
                    <button 
                      className="action-btn reject-btn"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal details-modal">
            <div className="modal-header">
              <h3>Booking Request Details - #{selectedRequest.id}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="details-section">
                <h4>Customer Information</h4>
                <div className="detail-item">
                  <strong>Name:</strong> {selectedRequest.customerName}
                </div>
                <div className="detail-item">
                  <strong>Phone:</strong> {selectedRequest.customerPhone}
                </div>
              </div>

              <div className="details-section">
                <h4>Booking Information</h4>
                <div className="detail-item">
                  <strong>Room ID:</strong> {selectedRequest.roomId}
                </div>
                <div className="detail-item">
                  <strong>Check-in Date:</strong> {new Date(selectedRequest.checkInDate).toLocaleDateString()}
                </div>
                <div className="detail-item">
                  <strong>Check-out Date:</strong> {new Date(selectedRequest.checkOutDate).toLocaleDateString()}
                </div>
                <div className="detail-item">
                  <strong>Duration Type:</strong> {selectedRequest.bookingDurationType}
                </div>
                <div className="detail-item">
                  <strong>Status:</strong> {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              <div className="details-section">
                <h4>Pricing Details</h4>
                <div className="detail-item">
                  <strong>Daily Cost:</strong> ₹{selectedRequest.dailyCost}
                </div>
                <div className="detail-item">
                  <strong>Monthly Cost:</strong> ₹{selectedRequest.monthlyCost}
                </div>
                <div className="detail-item">
                  <strong>Early Check-in Cost:</strong> ₹{selectedRequest.earlyCheckinCost}
                </div>
                <div className="detail-item total-cost">
                  <strong>Total Amount:</strong> ₹{selectedRequest.totalAmount}
                </div>
              </div>

              {selectedRequest.remarks && (
                <div className="details-section">
                  <h4>Remarks</h4>
                  <div className="remarks-content">
                    {selectedRequest.remarks}
                  </div>
                </div>
              )}

              <div className="details-section">
                <h4>Request Timeline</h4>
                <div className="detail-item">
                  <strong>Created:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}
                </div>
                <div className="detail-item">
                  <strong>Last Updated:</strong> {new Date(selectedRequest.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button 
                    className="btn btn-success"
                    onClick={() => {
                      handleApproveRequest(selectedRequest.id);
                      setShowDetailsModal(false);
                    }}
                  >
                    ✅ Approve Request
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      handleRejectRequest(selectedRequest.id);
                      setShowDetailsModal(false);
                    }}
                  >
                    ❌ Reject Request
                  </button>
                </>
              )}
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDetailsModal(false)}
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

export default BookingRequestsScreen;