// Notification Service for ProfPride App
class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.serviceWorkerRegistration = null;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Show a notification
  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Notifications not supported or permission not granted');
      return false;
    }

    try {
      const notificationOptions = {
        icon: '/logo192.png',
        badge: '/logo192.png',
        requireInteraction: true,
        ...options
      };

      if (this.serviceWorkerRegistration) {
        // Use service worker for better PWA experience
        await this.serviceWorkerRegistration.showNotification(title, notificationOptions);
      } else {
        // Fallback to regular notification
        new Notification(title, notificationOptions);
      }
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Show booking request notification
  async showBookingRequestNotification(bookingRequest) {
    const title = '🏨 New Booking Request!';
    const body = `${bookingRequest.customerName || 'Customer'} wants to book a room`;
    const options = {
      body,
      data: {
        type: 'booking_request',
        bookingRequestId: bookingRequest.id,
        url: '/adminpvt/bookings'
      },
      actions: [
        {
          action: 'view',
          title: 'View Request',
          icon: '/logo192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/logo192.png'
        }
      ]
    };

    return await this.showNotification(title, options);
  }

  // Show booking confirmation notification
  async showBookingConfirmationNotification(booking) {
    const title = '✅ Booking Confirmed!';
    const body = `Room ${booking.roomNumber} booked by ${booking.customerName}`;
    const options = {
      body,
      data: {
        type: 'booking_confirmed',
        bookingId: booking.id,
        url: '/adminpvt/bookings'
      }
    };

    return await this.showNotification(title, options);
  }

  // Show payment notification
  async showPaymentNotification(payment) {
    const title = '💰 Payment Received!';
    const body = `₹${payment.amount} payment from ${payment.customerName || 'Customer'}`;
    const options = {
      body,
      data: {
        type: 'payment_received',
        paymentId: payment.id,
        url: '/adminpvt/bookings'
      }
    };

    return await this.showNotification(title, options);
  }

  // Register service worker for better PWA experience
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorkerRegistration = registration;
        console.log('Service Worker registered successfully');
        return true;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return false;
      }
    }
    return false;
  }

  // Check if notifications are enabled
  isEnabled() {
    return this.isSupported && this.permission === 'granted';
  }

  // Get permission status
  getPermissionStatus() {
    return this.permission;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
