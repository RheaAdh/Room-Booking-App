import React from 'react';
import notificationService from '../services/notificationService';

const NotificationTest = () => {
  const testBookingRequestNotification = async () => {
    await notificationService.showBookingRequestNotification({
      id: 'TEST-001',
      customerName: 'Test Customer',
      phoneNumber: '9876543210',
      roomNumber: 'Room 101',
      checkInDate: '2024-01-15',
      checkOutDate: '2024-01-17'
    });
  };

  const testBookingConfirmationNotification = async () => {
    await notificationService.showBookingConfirmationNotification({
      id: 'BOOKING-001',
      customerName: 'Test Customer',
      roomNumber: 'Room 101'
    });
  };

  const testPaymentNotification = async () => {
    await notificationService.showPaymentNotification({
      id: 'PAYMENT-001',
      customerName: 'Test Customer',
      amount: 1500
    });
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>🔔 Notification Test Center</h2>
      <p>Test different types of notifications:</p>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={testBookingRequestNotification}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Booking Request
        </button>
        
        <button 
          onClick={testBookingConfirmationNotification}
          style={{
            padding: '10px 20px',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Booking Confirmation
        </button>
        
        <button 
          onClick={testPaymentNotification}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Payment Notification
        </button>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>📱 How to Enable Notifications:</h3>
        <ol style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <li>Click the notification bell icon (🔔/🔕) in the header</li>
          <li>Allow notifications when prompted by your browser</li>
          <li>For best experience, add this app to your home screen</li>
          <li>Test notifications using the buttons above</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationTest;
