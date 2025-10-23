import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { toLocalDateTimeString, fromLocalDateTimeString, toLocalDateString } from '../utils/dateUtils';
import './CaretakerBookingScreen.css';

const CaretakerBookingScreen = () => {
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
  
  // Image viewing states for new customer form
  const [showNewCustomerImageModal, setShowNewCustomerImageModal] = useState(false);
  const [selectedNewCustomerImageUrl, setSelectedNewCustomerImageUrl] = useState('');
  const [selectedNewCustomerImageTitle, setSelectedNewCustomerImageTitle] = useState('');
  
  // Payment dropdown states
  const [expandedPayments, setExpandedPayments] = useState(new Set());
  
  // Form states
  const [formData, setFormData] = useState(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    return {
      customerPhoneNumber: '',
      roomId: '',
      numberOfPeople: 1,
      checkInDate: today,
      checkOutDate: tomorrow,
      bookingStatus: 'CONFIRMED',
      bookingDurationType: 'DAILY',
      dailyCost: '',
      monthlyCost: '',
      earlyCheckinCost: '',
      lateCheckoutCost: ''
    };
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

  // Close customer search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCustomerSearch && !event.target.closest('.customer-search-container')) {
        setShowCustomerSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomerSearch]);

  // Close payments dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expandedPayments.size > 0 && !event.target.closest('.payments-dropdown')) {
        setExpandedPayments(new Set());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedPayments]);

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
            console.log(`Fetching payments for booking ${booking.id}`);
            const paymentsRes = await api.get(`/payments/booking/${booking.id}`);
            console.log(`Payments for booking ${booking.id}:`, paymentsRes.data);
            return {
              ...booking,
              payments: paymentsRes.data || []
            };
          } catch (error) {
            console.error(`Error fetching payments for booking ${booking.id}:`, error);
            console.error('Error details:', error.response?.data || error.message);
            return {
              ...booking,
              payments: []
            };
          }
        })
      );
      
      setBookings(bookingsWithPayments);
      setRooms(roomsRes.data);
      setRoomConfigurations(roomConfigsRes.data);
      setCustomers(customersRes.data);
      
      // Log the fetched bookings to see if they have the updated dates
      console.log('📅 Fetched bookings with dates:', bookingsWithPayments.map(b => ({
        id: b.id,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        updatedAt: b.updatedAt
      })));
      
      // Debug: Log booking data to see if payments are included
      console.log('Bookings with payments data:', bookingsWithPayments);
      if (bookingsWithPayments.length > 0) {
        console.log('First booking sample with payments:', bookingsWithPayments[0]);
      }
      
      // Test: Try to fetch all payments to see if API is working
      try {
        const allPaymentsRes = await api.get('/payments');
        console.log('All payments from API:', allPaymentsRes.data);
        
        // If individual payment fetching failed, try grouping all payments by booking ID
        if (allPaymentsRes.data && allPaymentsRes.data.length > 0) {
          const paymentsByBooking = {};
          allPaymentsRes.data.forEach(payment => {
            if (!paymentsByBooking[payment.bookingId]) {
              paymentsByBooking[payment.bookingId] = [];
            }
            paymentsByBooking[payment.bookingId].push(payment);
          });
          
          console.log('Payments grouped by booking ID:', paymentsByBooking);
          
          // Update bookings with payments if they don't have any
          const updatedBookings = bookingsWithPayments.map(booking => {
            if (!booking.payments || booking.payments.length === 0) {
              return {
                ...booking,
                payments: paymentsByBooking[booking.id] || []
              };
            }
            return booking;
          });
          
          setBookings(updatedBookings);
        }
      } catch (error) {
        console.error('Error fetching all payments:', error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    console.log(`🔄 handleInputChange called: ${field} = ${value}`);
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value
      };
      
      // Log date changes specifically
      if (field === 'checkInDate' || field === 'checkOutDate') {
        console.log(`📅 Date changed: ${field}`, {
          oldValue: prev[field],
          newValue: value,
          newFormDataDates: {
            checkInDate: newFormData.checkInDate,
            checkOutDate: newFormData.checkOutDate
          }
        });
      }
      
      // Auto-populate costs when room or number of people changes
      if (field === 'roomId' || field === 'numberOfPeople') {
        const roomConfig = getRoomConfiguration(newFormData.roomId, newFormData.numberOfPeople);
        console.log('Auto-populating costs:', {
          field,
          roomId: newFormData.roomId,
          numberOfPeople: newFormData.numberOfPeople,
          roomConfig
        });
        if (roomConfig) {
          newFormData.dailyCost = roomConfig.dailyCost;
          newFormData.monthlyCost = roomConfig.monthlyCost;
          console.log('Costs populated:', {
            dailyCost: newFormData.dailyCost,
            monthlyCost: newFormData.monthlyCost
          });
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

  const validateBookingForm = (formData) => {
    if (!formData.customerPhoneNumber) {
      alert('❌ Please select a customer.');
      return false;
    }
    if (formData.bookingDurationType === 'DAILY' && (!formData.dailyCost || parseFloat(formData.dailyCost) <= 0)) {
      alert('Please enter a valid daily cost for daily bookings.');
      return false;
    }
    if (formData.bookingDurationType === 'MONTHLY' && (!formData.monthlyCost || parseFloat(formData.monthlyCost) <= 0)) {
      alert('Please enter a valid monthly cost for monthly bookings.');
      return false;
    }
    return true;
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Form submission started');
    console.log('📅 Current form dates before validation:', {
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate
    });
    
    if (!validateBookingForm(formData)) {
      return;
    }
    
    try {
      const totalCost = calculateTotalCost(formData);
      
      const bookingPayload = {
        ...formData,
        roomId: parseInt(formData.roomId),
        checkInDate: toLocalDateTimeString(formData.checkInDate),
        checkOutDate: toLocalDateTimeString(formData.checkOutDate),
        dailyCost: parseFloat(formData.dailyCost) || 0,
        monthlyCost: parseFloat(formData.monthlyCost) || 0,
        earlyCheckinCost: parseFloat(formData.earlyCheckinCost) || 0,
        totalAmount: totalCost
      };
      
      if (isEditing && selectedBooking) {
        console.log('🔄 CARETAKER UPDATE BOOKING REQUEST');
        console.log('📋 Booking ID:', selectedBooking.id);
        console.log('📅 Form Data Dates:', {
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          checkInDateType: typeof formData.checkInDate,
          checkOutDateType: typeof formData.checkOutDate
        });
        console.log('📅 Processed Dates:', {
          checkInDate: toLocalDateTimeString(formData.checkInDate),
          checkOutDate: toLocalDateTimeString(formData.checkOutDate)
        });
        console.log('📊 Request Payload:', JSON.stringify(bookingPayload, null, 2));
        
        const response = await api.put(`/bookings/${selectedBooking.id}`, bookingPayload);
        
        console.log('✅ CARETAKER UPDATE SUCCESS - Response:', response.data);
        console.log('📅 Response dates:', {
          checkInDate: response.data.checkInDate,
          checkOutDate: response.data.checkOutDate,
          updatedAt: response.data.updatedAt
        });
        alert('✅ Booking updated successfully!');
        
        // For updates, just close the modal and refresh data
        setShowBookingModal(false);
        setIsEditing(false);
        setSelectedBooking(null);
        console.log('🔄 Refreshing data after update...');
        await fetchData();
        console.log('✅ Data refresh completed');
      } else {
        console.log('🆕 CARETAKER CREATE BOOKING REQUEST');
        console.log('📊 Request Payload:', JSON.stringify(bookingPayload, null, 2));
        
        const response = await api.post('/bookings', bookingPayload);
        
        console.log('✅ CARETAKER CREATE SUCCESS - Response:', response.data);
        alert(`✅ Booking created successfully! Total Amount: Rs.${totalCost.toFixed(2)}`);
        
        // For creates, reset the form and close the modal
        setShowBookingModal(false);
        setIsEditing(false);
        setSelectedBooking(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error creating/updating booking:', error);
      if (error.response?.status === 409) {
        const conflictMessage = error.response?.headers?.['x-error-message'] || 
                               error.response?.data?.message || 
                               'Room is already booked for the selected dates. Please choose different dates or room.';
        setConflictMessage(conflictMessage);
        setShowConflictModal(true);
      } else {
        alert('❌ Error creating/updating booking. Please try again.');
      }
    }
  };

  const handleEditBooking = (booking) => {
    console.log('🔄 handleEditBooking called with booking:', booking);
    console.log('📅 Booking dates from state:', {
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      checkInDateType: typeof booking.checkInDate,
      checkOutDateType: typeof booking.checkOutDate
    });
    
    // Parse dates properly - handle both string and Date formats
    let checkInDate, checkOutDate;
    
    // Parse check-in date
    if (typeof booking.checkInDate === 'string') {
      console.log('📅 Parsing checkInDate string:', booking.checkInDate);
      checkInDate = fromLocalDateTimeString(booking.checkInDate);
      console.log('📅 Parsed checkInDate:', checkInDate);
      if (!checkInDate || isNaN(checkInDate.getTime())) {
        console.log('📅 CheckInDate parsing failed, using fallback');
        checkInDate = new Date(booking.checkInDate);
      }
    } else {
      console.log('📅 CheckInDate is not string, creating new Date');
      checkInDate = new Date(booking.checkInDate);
    }
    
    // Parse check-out date
    if (typeof booking.checkOutDate === 'string') {
      console.log('📅 Parsing checkOutDate string:', booking.checkOutDate);
      checkOutDate = fromLocalDateTimeString(booking.checkOutDate);
      console.log('📅 Parsed checkOutDate:', checkOutDate);
      if (!checkOutDate || isNaN(checkOutDate.getTime())) {
        console.log('📅 CheckOutDate parsing failed, using fallback');
        checkOutDate = new Date(booking.checkOutDate);
      }
    } else {
      console.log('📅 CheckOutDate is not string, creating new Date');
      checkOutDate = new Date(booking.checkOutDate);
    }
    
    // Ensure dates are valid
    if (isNaN(checkInDate.getTime())) {
      checkInDate = new Date();
    }
    if (isNaN(checkOutDate.getTime())) {
      checkOutDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    
    console.log('Original checkInDate:', booking.checkInDate, typeof booking.checkInDate);
    console.log('Original checkOutDate:', booking.checkOutDate, typeof booking.checkOutDate);
    console.log('Parsed checkInDate:', checkInDate);
    console.log('Parsed checkOutDate:', checkOutDate);
    console.log('toLocalDateString checkInDate:', toLocalDateString(checkInDate));
    console.log('toLocalDateString checkOutDate:', toLocalDateString(checkOutDate));
    
    // Find the customer name from the phone number
    const customer = customers.find(c => c.phoneNumber === booking.customerPhoneNumber);
    const customerName = customer ? customer.name : '';
    
    console.log('📅 Setting form data with dates:', {
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      checkInDateString: checkInDate.toISOString(),
      checkOutDateString: checkOutDate.toISOString()
    });
    
    setFormData({
      customerPhoneNumber: booking.customerPhoneNumber || '',
      roomId: booking.roomId || '',
      numberOfPeople: booking.numberOfPeople || 1,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      bookingStatus: booking.bookingStatus,
      bookingDurationType: booking.bookingDurationType || 'DAILY',
      dailyCost: booking.dailyCost || '',
      monthlyCost: booking.monthlyCost || '',
      earlyCheckinCost: booking.earlyCheckinCost || '',
      lateCheckoutCost: booking.lateCheckoutCost || ''
    });
    
    // Set the customer search term to show the selected customer's name
    setCustomerSearchTerm(customerName);
    
    setSelectedBooking(booking);
    setIsEditing(true);
    setShowBookingModal(true);
  };

  // Customer search functions
  const handleCustomerSearch = (searchTerm) => {
    setCustomerSearchTerm(searchTerm);
    if (searchTerm.length > 0) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers([]);
    }
  };

  const handleSelectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerPhoneNumber: customer.phoneNumber
    }));
    setCustomerSearchTerm(customer.name); // Show the selected customer's name in the search field
    setShowCustomerSearch(false);
    setFilteredCustomers([]);
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/customer', contactFormData);
      if (response.data) {
        // Refresh customers list
        await fetchData();
        // Set the new customer's phone number in the form
        setFormData(prev => ({
          ...prev,
          customerPhoneNumber: contactFormData.phoneNumber
        }));
        // Set the search term to show the new customer's name
        setCustomerSearchTerm(contactFormData.name);
        setShowContactForm(false);
        setContactFormData({
          name: '',
          phoneNumber: '',
          additionalPhoneNumber: '',
          photoIdProofUrl: ''
        });
        alert('✅ Contact created successfully!');
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('❌ Error creating contact. Please try again.');
    }
  };

  const handleCreateNewCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/customer', newCustomerFormData);
      if (response.data) {
        // Refresh customers list
        await fetchData();
        // Set the new customer's phone number in the form
        setFormData(prev => ({
          ...prev,
          customerPhoneNumber: newCustomerFormData.phoneNumber
        }));
        // Set the search term to show the new customer's name
        setCustomerSearchTerm(newCustomerFormData.name);
        setShowNewCustomerForm(false);
        setNewCustomerFormData({
          name: '',
          phoneNumber: '',
          additionalPhoneNumber: '',
          photoIdProofUrl: '',
          remarks: '',
          idProofUrls: []
        });
        alert('✅ New customer created successfully!');
      }
    } catch (error) {
      console.error('Error creating new customer:', error);
      alert('❌ Error creating new customer. Please try again.');
    }
  };

  const handleNewCustomerIdProofUpload = async (e) => {
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
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" is not a supported format. Please use JPG, PNG, PDF, or HEIC.`);
        return;
      }
    }

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/upload/photo-id-proof', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          params: {
            phoneNumber: formData.customerPhoneNumber || 'temp-' + Date.now()
          }
        });
        
        return response.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Add to existing ID proof URLs
      setNewCustomerFormData(prev => ({
        ...prev,
        idProofUrls: [...(prev.idProofUrls || []), ...uploadedUrls]
      }));
      
      // Clear the file input
      e.target.value = '';
      
    } catch (error) {
      console.error('Error uploading ID proof:', error);
      alert('❌ Error uploading ID proof. Please try again.');
    }
  };

  const handleViewNewCustomerImage = (url, title) => {
    setSelectedNewCustomerImageUrl(url);
    setSelectedNewCustomerImageTitle(title);
    setShowNewCustomerImageModal(true);
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

  // Calculate due amount for a booking
  const calculateDueAmount = (booking) => {
    if (!booking) return 0;
    
    const totalAmount = booking.totalAmount || 0;
    const paidAmount = booking.payments ? 
      booking.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0) : 0;
    
    return Math.max(0, totalAmount - paidAmount);
  };

  // Get payment status based on due amount
  const getPaymentStatus = (booking) => {
    const dueAmount = calculateDueAmount(booking);
    return dueAmount > 0 ? 'PENDING' : 'PAID';
  };

  // Payment dropdown functions
  const togglePaymentsDropdown = (bookingId) => {
    console.log('Toggling payments dropdown for booking:', bookingId);
    const newExpanded = new Set(expandedPayments);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedPayments(newExpanded);
    console.log('New expanded state:', newExpanded);
  };

  const handleEditPaymentFromDropdown = (payment) => {
    console.log('Editing payment from dropdown:', payment);
    
    setSelectedBooking(bookings.find(b => b.payments?.some(p => p.id === payment.id)));
    
    // Ensure booking modal is closed when editing payment
    setShowBookingModal(false);
    setIsEditing(false);
    
    setPaymentData({
      amount: payment.amount?.toString() || '',
      mode: payment.paymentMethod || '',
      createdAt: new Date(payment.paymentDate || payment.createdAt),
      paymentScreenshotUrl: payment.paymentScreenshotUrl || ''
    });
    setIsEditingPayment(true);
    setEditingPaymentId(payment.id);
    setShowPaymentModal(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!paymentData.amount || paymentData.amount <= 0) {
      alert('❌ Please enter a valid payment amount');
      return;
    }
    
    if (!paymentData.mode) {
      alert('❌ Please select a payment mode');
      return;
    }
    
    if (!selectedBooking || !selectedBooking.id) {
      alert('❌ No booking selected');
      return;
    }
    
    try {
      // Convert date to proper format for backend
      const paymentDate = new Date(paymentData.createdAt);
      paymentDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      
      const paymentPayload = {
        bookingId: selectedBooking.id,
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.mode, // This should match PaymentMode enum values (CASH, ONLINE, CARETAKER)
        paymentScreenshotUrl: paymentData.paymentScreenshotUrl || '',
        paymentDate: toLocalDateTimeString(paymentDate) // Send as local datetime string, backend will parse it
      };
      
      console.log('Payment payload:', paymentPayload);
      
      if (isEditingPayment && editingPaymentId) {
        // Update existing payment
        console.log('Updating payment with ID:', editingPaymentId);
        await api.put(`/payments/${editingPaymentId}`, paymentPayload);
        alert('✅ Payment updated successfully!');
      } else {
        // Create new payment
        console.log('Creating new payment');
        const response = await api.post('/payments', paymentPayload);
        console.log('Payment created successfully:', response.data);
        alert('✅ Payment added successfully!');
      }
      
      // Immediately update the selected booking's payments if we're in edit mode
      if (isEditing && selectedBooking) {
        // Fetch the updated booking with payments
        try {
          const updatedBookingResponse = await api.get(`/bookings/${selectedBooking.id}`);
          const updatedBooking = updatedBookingResponse.data;
          
          // Fetch payments for this booking
          const paymentsResponse = await api.get(`/payments/booking/${selectedBooking.id}`);
          updatedBooking.payments = paymentsResponse.data;
          
          // Update the selected booking in state
          setSelectedBooking(updatedBooking);
          
          // Also update the booking in the main bookings list
          setBookings(prevBookings => 
            prevBookings.map(booking => 
              booking.id === selectedBooking.id ? updatedBooking : booking
            )
          );
        } catch (error) {
          console.error('Error fetching updated booking:', error);
          // Fallback to full data refresh
          fetchData();
        }
      } else {
        // If not in edit mode, just refresh all data
        fetchData();
      }
      
      setShowPaymentModal(false);
      setIsEditingPayment(false);
      setEditingPaymentId(null);
      setPaymentData({ amount: '', mode: '', createdAt: new Date(), paymentScreenshotUrl: '' });
    } catch (error) {
      console.error('Error adding payment:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      let errorMessage = '❌ Error adding payment. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = `❌ Error: ${error.response.data.message}`;
      } else if (error.response?.data?.error) {
        errorMessage = `❌ Error: ${error.response.data.error}`;
      }
      
      alert(errorMessage);
    }
  };

  const handleEditPayment = (payment) => {
    console.log('Editing payment:', payment);
    
    // Find the booking that contains this payment
    const booking = bookings.find(b => b.payments && b.payments.some(p => p.id === payment.id));
    if (booking) {
      setSelectedBooking(booking);
    }
    
    // Ensure booking modal is closed when editing payment
    setShowBookingModal(false);
    setIsEditing(false);
    
    setIsEditingPayment(true);
    setEditingPaymentId(payment.id);
    setPaymentData({
      amount: payment.amount?.toString() || '',
      mode: payment.paymentMethod || '',
      createdAt: new Date(payment.paymentDate || payment.createdAt),
      paymentScreenshotUrl: payment.paymentScreenshotUrl || ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentScreenshotUpload = async (e) => {
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

    if (!selectedBooking || !selectedBooking.customerPhoneNumber) {
      alert('❌ No booking selected. Please select a booking first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/payments/upload-screenshot-new', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          phoneNumber: selectedBooking.customerPhoneNumber
        }
      });

      if (response.data.success) {
        setPaymentData(prev => ({
          ...prev,
          paymentScreenshotUrl: response.data.fileUrl
        }));
        alert('✅ Payment screenshot uploaded successfully!');
      } else {
        alert('❌ Error uploading payment screenshot: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error uploading payment screenshot:', error);
      alert('❌ Error uploading payment screenshot. Please try again.');
    }
  };

  const handleViewImage = (imageUrl, title) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageTitle(title);
    setShowImageModal(true);
  };

  const downloadInvoicePdf = async (bookingId) => {
    try {
      console.log('Downloading invoice for booking:', bookingId);
      
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

  const resetForm = () => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    setFormData({
      customerPhoneNumber: '',
      roomId: '',
      numberOfPeople: 1,
      checkInDate: today,
      checkOutDate: tomorrow,
      bookingStatus: 'CONFIRMED',
      bookingDurationType: 'DAILY',
      dailyCost: '',
      monthlyCost: '',
      earlyCheckinCost: '',
      lateCheckoutCost: ''
    });
    setCustomerSearchTerm('');
    setShowCustomerSearch(false);
    setFilteredCustomers([]);
  };

  const handleCheckIn = async (bookingId) => {
    if (window.confirm('Are you sure you want to check-in this customer?')) {
      try {
        await api.patch(`/bookings/${bookingId}/checkin`);
        fetchData(); // Refresh data
        alert('Customer checked-in successfully!');
      } catch (error) {
        console.error('Error checking in:', error);
        alert('Error checking in customer. Please try again.');
      }
    }
  };

  const handleCheckOut = async (bookingId) => {
    if (window.confirm('Are you sure you want to check-out this customer?')) {
      try {
        await api.patch(`/bookings/${bookingId}/checkout`);
        fetchData(); // Refresh data
        alert('Customer checked-out successfully!');
      } catch (error) {
        console.error('Error checking out:', error);
        alert('Error checking out customer. Please try again.');
      }
    }
  };

  const filteredAndSortedBookings = bookings.filter(booking => {
    // First apply date filter - only show today, tomorrow, and yesterday bookings
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Normalize dates to compare only the date part (ignore time)
    const normalizeDate = (date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };
    
    const bookingCheckInDate = normalizeDate(new Date(booking.checkInDate));
    const bookingCheckOutDate = normalizeDate(new Date(booking.checkOutDate));
    const todayNormalized = normalizeDate(today);
    const tomorrowNormalized = normalizeDate(tomorrow);
    const yesterdayNormalized = normalizeDate(yesterday);
    
    // Check if booking overlaps with today, tomorrow, or yesterday
    const isRelevantBooking = (
      // Check-in is today, tomorrow, or yesterday
      (bookingCheckInDate.getTime() === todayNormalized.getTime() ||
       bookingCheckInDate.getTime() === tomorrowNormalized.getTime() ||
       bookingCheckInDate.getTime() === yesterdayNormalized.getTime()) ||
      // Check-out is today, tomorrow, or yesterday
      (bookingCheckOutDate.getTime() === todayNormalized.getTime() ||
       bookingCheckOutDate.getTime() === tomorrowNormalized.getTime() ||
       bookingCheckOutDate.getTime() === yesterdayNormalized.getTime()) ||
      // Booking spans across today, tomorrow, or yesterday
      (bookingCheckInDate <= todayNormalized && bookingCheckOutDate >= todayNormalized) ||
      (bookingCheckInDate <= tomorrowNormalized && bookingCheckOutDate >= tomorrowNormalized) ||
      (bookingCheckInDate <= yesterdayNormalized && bookingCheckOutDate >= yesterdayNormalized)
    );
    
    if (!isRelevantBooking) {
      return false;
    }
    
    // Apply search filter (by name, phone, or room)
    if (searchTerm.trim() === '') return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customer = customers.find(c => c.phoneNumber === booking.customerPhoneNumber);
    const room = rooms.find(r => r.id === booking.roomId);
    
    const matchesSearch = (
      customer?.name?.toLowerCase().includes(searchLower) ||
      booking.customerPhoneNumber?.includes(searchTerm) ||
      room?.roomNumber?.toLowerCase().includes(searchLower)
    );
    
    return matchesSearch;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'createdAt':
        aValue = new Date(a.createdAt || a.id);
        bValue = new Date(b.createdAt || b.id);
        break;
      case 'checkInDate':
        aValue = new Date(a.checkInDate);
        bValue = new Date(b.checkInDate);
        break;
      case 'customerName':
        const customerA = customers.find(c => c.phoneNumber === a.customerPhoneNumber);
        const customerB = customers.find(c => c.phoneNumber === b.customerPhoneNumber);
        aValue = customerA?.name || '';
        bValue = customerB?.name || '';
        break;
      case 'totalAmount':
        aValue = parseFloat(a.totalAmount) || 0;
        bValue = parseFloat(b.totalAmount) || 0;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return '#f39c12';
      case 'CONFIRMED': return '#27ae60';
      case 'CHECKED_IN': return '#3498db';
      case 'CHECKED_OUT': return '#95a5a6';
      case 'CANCELLED': return '#e74c3c';
      default: return '#6c757d';
    }
  };

  // Helper function to determine which day a booking is for
  const getBookingDayType = (booking) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const normalizeDate = (date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };
    
    const bookingCheckInDate = normalizeDate(new Date(booking.checkInDate));
    const bookingCheckOutDate = normalizeDate(new Date(booking.checkOutDate));
    const todayNormalized = normalizeDate(today);
    const tomorrowNormalized = normalizeDate(tomorrow);
    const yesterdayNormalized = normalizeDate(yesterday);
    
    // Check if booking is for today
    if (bookingCheckInDate.getTime() === todayNormalized.getTime() ||
        bookingCheckOutDate.getTime() === todayNormalized.getTime() ||
        (bookingCheckInDate <= todayNormalized && bookingCheckOutDate >= todayNormalized)) {
      return { type: 'today', label: 'Today', color: '#e74c3c', icon: '📅' };
    }
    
    // Check if booking is for tomorrow
    if (bookingCheckInDate.getTime() === tomorrowNormalized.getTime() ||
        bookingCheckOutDate.getTime() === tomorrowNormalized.getTime() ||
        (bookingCheckInDate <= tomorrowNormalized && bookingCheckOutDate >= tomorrowNormalized)) {
      return { type: 'tomorrow', label: 'Tomorrow', color: '#f39c12', icon: '⏰' };
    }
    
    // Check if booking is for yesterday
    if (bookingCheckInDate.getTime() === yesterdayNormalized.getTime() ||
        bookingCheckOutDate.getTime() === yesterdayNormalized.getTime() ||
        (bookingCheckInDate <= yesterdayNormalized && bookingCheckOutDate >= yesterdayNormalized)) {
      return { type: 'yesterday', label: 'Yesterday', color: '#95a5a6', icon: '📋' };
    }
    
    return { type: 'other', label: 'Other', color: '#6c757d', icon: '📅' };
  };

  if (loading) {
    return (
      <div className="caretaker-loading">
        <div className="loading-spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="caretaker-booking">

  

      {/* Date Range Header */}
      {activeTab === 'list' && (
        <div className="date-range-header" style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '12px 16px', 
          borderBottom: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#495057',
            marginBottom: '4px'
          }}>
            📅 Showing bookings for:
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6c757d',
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <span style={{ color: '#e74c3c' }}>📅 Today</span>
            <span style={{ color: '#f39c12' }}>⏰ Tomorrow</span>
            <span style={{ color: '#95a5a6' }}>📋 Yesterday</span>
          </div>
        </div>
      )}

      {/* Search Filter */}
      {activeTab === 'list' && (
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
      )}

      {/* Content */}
      <div className="booking-content">
        {activeTab === 'list' ? (
          <div className="bookings-list">
            {filteredAndSortedBookings.length > 0 ? (
              filteredAndSortedBookings.map((booking) => {
                // Find customer data
                const customer = customers.find(c => c.phoneNumber === booking.customerPhoneNumber);
                const dayType = getBookingDayType(booking);
                
                return (
                <div key={booking.id} className="booking-card compact-booking-card">
                  <div className="compact-booking-content">
                    <div className="compact-booking-main">
                      <div className="compact-booking-info">
                        <div className="compact-booking-header">
                          <span className="compact-customer-name">{customer?.name || 'Unknown Customer'}</span>
                          <span 
                            className="compact-day-badge"
                            style={{ 
                              backgroundColor: dayType.color,
                              color: 'white',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontWeight: 'bold'
                            }}
                          >
                            {dayType.icon} {dayType.label}
                          </span>
                        </div>
                        <span className="compact-phone">📞 {booking.customerPhoneNumber}</span>
                        <span className="compact-room">🏠 Room {rooms.find(r => r.id === booking.roomId)?.roomNumber || booking.roomId}</span>
                        <span className="compact-dates">
                          📅 {new Date(booking.checkInDate).toLocaleDateString('en-IN')} - {new Date(booking.checkOutDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="compact-booking-status">
                        <span 
                          className="compact-status-badge"
                          style={{ backgroundColor: getStatusColor(booking.bookingStatus) }}
                        >
                          {booking.bookingStatus}
                        </span>
                      </div>
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
                );
              })
            ) : (
              <div className="no-bookings">
                <div className="no-bookings-icon">📅</div>
                <h3>No bookings for today, tomorrow, or yesterday</h3>
                <p>No bookings found for the current date range. Try adjusting your search or add a new booking.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="add-booking-placeholder">
            <div className="placeholder-icon">📝</div>
            <h3>Add New Booking</h3>
            <p>Click the "Add Booking" button above to create a new booking.</p>
            <button 
              className="add-booking-btn"
              onClick={() => {
                resetForm();
                setIsEditing(false);
                setSelectedBooking(null);
                setShowBookingModal(true);
              }}
            >
              ➕ Add New Booking
            </button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Booking' : 'Add New Booking'}</h3>
              <button 
                className="close-btn"
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
            <form onSubmit={handleCreateBooking} className="modal-body">
              <div className="form-group">
                <label className="form-label">👤 Customer</label>
                <div className="customer-search-container">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search customer by name or phone..."
                    value={customerSearchTerm}
                    onChange={(e) => {
                      handleCustomerSearch(e.target.value);
                      setShowCustomerSearch(true);
                    }}
                    onFocus={() => setShowCustomerSearch(true)}
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
                            <div className="customer-phone">{customer.phoneNumber}</div>
                          </div>
                        ))
                      ) : customerSearchTerm.length > 0 ? (
                        <div className="no-customers-found">
                          <div>No customers found</div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowNewCustomerForm(true)}
                          >
                            + Create New Customer
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                {formData.customerPhoneNumber && (
                  <div className="selected-customer">
                    <span>Selected: {customers.find(c => c.phoneNumber === formData.customerPhoneNumber)?.name || formData.customerPhoneNumber}</span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, customerPhoneNumber: '' }));
                        setCustomerSearchTerm('');
                        setShowCustomerSearch(false);
                        setFilteredCustomers([]);
                      }}
                    >
                      Change
                    </button>
                  </div>
                )}
                
                {/* Always show create new customer button when creating new booking */}
                {!isEditing && (
                  <div className="create-customer-section">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setShowNewCustomerForm(true)}
                    >
                      + Create New Customer
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">🏠 Room</label>
                <select
                  className="form-control"
                  value={formData.roomId}
                  onChange={(e) => handleInputChange('roomId', e.target.value)}
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
                  value={formData.numberOfPeople}
                  onChange={(e) => handleInputChange('numberOfPeople', parseInt(e.target.value))}
                  required
                  disabled={!formData.roomId}
                >
                  <option value="">{formData.roomId ? 'Select Number of People' : 'Select Room First'}</option>
                  {formData.roomId ? 
                    (() => {
                      const configs = roomConfigurations.filter(config => config.roomId === parseInt(formData.roomId));
                      console.log('Room ID:', formData.roomId, 'Configs:', configs);
                      return [...new Set(configs.map(config => config.personCount))]
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
                  value={(() => {
                    const value = toLocalDateString(formData.checkInDate);
                    console.log('📅 Check-in input value being set to:', value, 'from formData.checkInDate:', formData.checkInDate);
                    return value;
                  })()}
                  onChange={(e) => {
                    console.log('🎯 CHECK-IN DATE INPUT CHANGED!');
                    console.log('📅 Input value:', e.target.value);
                    console.log('📅 Event type:', e.type);
                    console.log('📅 Current formData.checkInDate:', formData.checkInDate);
                    
                    if (e.target.value) {
                      // Preserve the original time, only update the date part
                      const originalDate = formData.checkInDate;
                      console.log('📅 Original date to preserve time from:', originalDate);
                      console.log('📅 Original date hours/minutes:', originalDate ? `${originalDate.getHours()}:${originalDate.getMinutes()}` : 'null');
                      
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      console.log('📅 Parsed date parts:', { year, month, day });
                      console.log('📅 Current year:', new Date().getFullYear());
                      console.log('📅 Selected year vs current year:', year, 'vs', new Date().getFullYear());
                      
                      const newDate = new Date(
                        year, 
                        month - 1, 
                        day, 
                        originalDate ? originalDate.getHours() : 0, 
                        originalDate ? originalDate.getMinutes() : 0, 
                        originalDate ? originalDate.getSeconds() : 0
                      );
                      console.log('📅 New date created:', newDate);
                      console.log('📅 New date string:', newDate.toISOString());
                      console.log('📅 Calling handleInputChange with new date...');
                      handleInputChange('checkInDate', newDate);
                    } else {
                      console.log('📅 Empty value, setting to current date');
                      handleInputChange('checkInDate', new Date());
                    }
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📅 Check-out Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={(() => {
                    const value = toLocalDateString(formData.checkOutDate);
                    console.log('📅 Check-out input value being set to:', value, 'from formData.checkOutDate:', formData.checkOutDate);
                    return value;
                  })()}
                  onChange={(e) => {
                    console.log('🎯 CHECK-OUT DATE INPUT CHANGED!');
                    console.log('📅 Input value:', e.target.value);
                    console.log('📅 Event type:', e.type);
                    console.log('📅 Current formData.checkOutDate:', formData.checkOutDate);
                    
                    if (e.target.value) {
                      // Preserve the original time, only update the date part
                      const originalDate = formData.checkOutDate;
                      console.log('📅 Original date to preserve time from:', originalDate);
                      console.log('📅 Original date hours/minutes:', originalDate ? `${originalDate.getHours()}:${originalDate.getMinutes()}` : 'null');
                      
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      console.log('📅 Parsed date parts:', { year, month, day });
                      
                      const newDate = new Date(
                        year, 
                        month - 1, 
                        day, 
                        originalDate ? originalDate.getHours() : 0, 
                        originalDate ? originalDate.getMinutes() : 0, 
                        originalDate ? originalDate.getSeconds() : 0
                      );
                      console.log('📅 New date created:', newDate);
                      console.log('📅 New date string:', newDate.toISOString());
                      console.log('📅 Calling handleInputChange with new date...');
                      handleInputChange('checkOutDate', newDate);
                    } else {
                      console.log('📅 Empty value, setting to tomorrow');
                      handleInputChange('checkOutDate', new Date(Date.now() + 24 * 60 * 60 * 1000));
                    }
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📊 Booking Status</label>
                <select
                  className="form-control"
                  value={formData.bookingStatus}
                  onChange={(e) => handleInputChange('bookingStatus', e.target.value)}
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
                  value={formData.bookingDurationType}
                  onChange={(e) => handleInputChange('bookingDurationType', e.target.value)}
                  required
                >
                  <option value="DAILY">Daily</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              {formData.bookingDurationType === 'DAILY' && (
                <div className="form-group">
                  <label className="form-label">
                    💰 Daily Cost (Rs.)
                    <small style={{ color: '#6c757d', marginLeft: '8px' }}>
                      (Auto-populated, editable for bargaining)
                    </small>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.dailyCost}
                    onChange={(e) => handleInputChange('dailyCost', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter daily cost"
                    required
                    style={{ 
                      backgroundColor: formData.dailyCost ? '#f8f9fa' : 'white',
                      border: formData.dailyCost ? '1px solid #28a745' : '1px solid #ced4da'
                    }}
                  />
                </div>
              )}

              {formData.bookingDurationType === 'MONTHLY' && (
                <div className="form-group">
                  <label className="form-label">
                    💰 Monthly Cost (Rs.)
                    <small style={{ color: '#6c757d', marginLeft: '8px' }}>
                      (Auto-populated, editable for bargaining)
                    </small>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.monthlyCost}
                    onChange={(e) => handleInputChange('monthlyCost', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter monthly cost"
                    required
                    style={{ 
                      backgroundColor: formData.monthlyCost ? '#f8f9fa' : 'white',
                      border: formData.monthlyCost ? '1px solid #28a745' : '1px solid #ced4da'
                    }}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">⏰ Early Check-in Cost (Rs.)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.earlyCheckinCost}
                  onChange={(e) => handleInputChange('earlyCheckinCost', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Enter early check-in cost"
                />
              </div>

              <div className="form-group">
                <label className="form-label">🕐 Late Check-out Cost (Rs.)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.lateCheckoutCost}
                  onChange={(e) => handleInputChange('lateCheckoutCost', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Enter late check-out cost"
                />
              </div>

              {/* Payments Section - Only show when editing */}
              {isEditing && selectedBooking && (
                <div className="payments-section-modal">
                  <h4 className="payments-section-title">💳 Payments</h4>
                  <div className="payments-list-modal">
                    {selectedBooking.payments && selectedBooking.payments.length > 0 ? (
                      selectedBooking.payments.map((payment) => (
                        <div key={payment.id} className="payment-item-modal">
                          <div className="payment-info-modal">
                            <div className="payment-amount-modal">Rs.{payment.amount}</div>
                            <div className="payment-details-modal">
                              <span className="payment-mode-modal">{payment.paymentMethod}</span>
                              <span className="payment-date-modal">
                                {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <div className="payment-actions-modal">
                            <button 
                              className="edit-payment-btn-modal"
                              onClick={() => handleEditPayment(payment)}
                              title="Edit Payment"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-payments-modal">
                        <span>No payments recorded for this booking</span>
                      </div>
                    )}
                  </div>
                  <div className="add-payment-section-modal">
                    <button 
                      type="button"
                      className="add-payment-btn-modal"
                      onClick={() => {
                        setPaymentData({ amount: '', mode: '', createdAt: new Date(), paymentScreenshotUrl: '' });
                        setIsEditingPayment(false);
                        setEditingPaymentId(null);
                        setShowPaymentModal(true);
                      }}
                    >
                      💳 Add Payment
                    </button>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="mobile-btn mobile-btn-secondary" 
                  onClick={() => {
                    setShowBookingModal(false);
                    setIsEditing(false);
                    setSelectedBooking(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="mobile-btn mobile-btn-primary">
                  {isEditing ? '✏️ Update Booking' : '✅ Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditingPayment ? 'Edit Payment' : 'Add Payment'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowPaymentModal(false);
                  setIsEditingPayment(false);
                  setEditingPaymentId(null);
                  setSelectedBooking(null);
                  setPaymentData({ amount: '', mode: '', createdAt: new Date(), paymentScreenshotUrl: '' });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddPayment} className="modal-body">
              <div className="form-group">
                <label className="form-label">💰 Amount (Rs.)</label>
                <input
                  type="number"
                  className="form-control"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                  min="0"
                  step="0.01"
                  placeholder="Enter payment amount"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">💳 Payment Mode</label>
                <select
                  className="form-control"
                  value={paymentData.mode}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, mode: e.target.value }))}
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="CARETAKER">Caretaker</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">📅 Payment Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={toLocalDateString(paymentData.createdAt)}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, createdAt: new Date(e.target.value) }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📸 Payment Screenshot</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*,.pdf"
                  onChange={handlePaymentScreenshotUpload}
                  id="paymentScreenshotFile"
                />
                {paymentData.paymentScreenshotUrl && (
                  <div className="upload-success">
                    <small className="text-success">✅ Payment screenshot uploaded successfully</small>
                    <br />
                    <div style={{ marginTop: '5px' }}>
                      <button
                        onClick={() => handleViewImage(paymentData.paymentScreenshotUrl, 'Payment Screenshot')}
                        className="view-document-btn"
                        style={{ 
                          marginRight: '5px',
                          padding: '4px 8px', 
                          backgroundColor: '#007bff', 
                          color: 'white', 
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        👁️ View
                      </button>
                      <a 
                        href={paymentData.paymentScreenshotUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-document-btn"
                        style={{ 
                          display: 'inline-block', 
                          padding: '4px 8px', 
                          backgroundColor: '#28a745', 
                          color: 'white', 
                          textDecoration: 'none', 
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}
                      >
                        🔗 Open in New Tab
                      </a>
                    </div>
                  </div>
                )}
                <small className="form-text">
                  Upload a screenshot or receipt of the payment (Max 10MB)
                </small>
              </div>

              <div className="form-actions">
                <button type="button" className="mobile-btn mobile-btn-secondary" onClick={() => {
                  setShowPaymentModal(false);
                  setIsEditingPayment(false);
                  setEditingPaymentId(null);
                  setSelectedBooking(null);
                  setPaymentData({ amount: '', mode: '', createdAt: new Date(), paymentScreenshotUrl: '' });
                }}>
                  Cancel
                </button>
                <button type="submit" className="mobile-btn mobile-btn-primary">
                  {isEditingPayment ? '✏️ Update Payment' : '✅ Add Payment'}
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

      {/* Room Conflict Modal */}
      {showConflictModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ backgroundColor: '#dc3545', color: 'white' }}>
              <h3>🚫 Room Not Available</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowConflictModal(false)}
                style={{ color: 'white' }}
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                <p style={{ fontSize: '16px', margin: '0', color: '#dc3545' }}>
                  {conflictMessage}
                </p>
              </div>
              <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>What you can do:</h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#6c757d' }}>
                  <li>Choose different check-in or check-out dates</li>
                  <li>Select a different room</li>
                  <li>Check room availability for your preferred dates</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button 
                className="btn btn-primary"
                onClick={() => setShowConflictModal(false)}
                style={{ padding: '10px 20px' }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Creation Modal */}
      {showContactForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>👤 Create New Contact</h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowContactForm(false);
                  setContactFormData({
                    name: '',
                    phoneNumber: '',
                    additionalPhoneNumber: '',
                    photoIdProofUrl: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateContact} className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={contactFormData.name}
                  onChange={(e) => setContactFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-control"
                  value={contactFormData.phoneNumber}
                  onChange={(e) => setContactFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Additional Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={contactFormData.additionalPhoneNumber}
                  onChange={(e) => setContactFormData(prev => ({ ...prev, additionalPhoneNumber: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ID Proof URL</label>
                <input
                  type="url"
                  className="form-control"
                  value={contactFormData.photoIdProofUrl}
                  onChange={(e) => setContactFormData(prev => ({ ...prev, photoIdProofUrl: e.target.value }))}
                  placeholder="https://example.com/id-proof.jpg"
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowContactForm(false);
                    setContactFormData({
                      name: '',
                      phoneNumber: '',
                      additionalPhoneNumber: '',
                      photoIdProofUrl: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Customer Creation Modal */}
      {showNewCustomerForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Customer</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowNewCustomerForm(false);
                  resetNewCustomerForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateNewCustomer} className="modal-body">
              <div className="form-group">
                <label className="form-label">👤 Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCustomerFormData.name}
                  onChange={(e) => setNewCustomerFormData({...newCustomerFormData, name: e.target.value})}
                  required
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">📱 Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={newCustomerFormData.phoneNumber}
                  onChange={(e) => setNewCustomerFormData({...newCustomerFormData, phoneNumber: e.target.value})}
                  required
                  placeholder="Enter phone number"
                />
              </div>
              
              
              <div className="form-group">
                <label className="form-label">📱 Additional Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={newCustomerFormData.additionalPhoneNumber}
                  onChange={(e) => setNewCustomerFormData({...newCustomerFormData, additionalPhoneNumber: e.target.value})}
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
                  onChange={handleNewCustomerIdProofUpload}
                  id="newCustomerIdProofFile"
                  multiple
                />
                
                {/* Legacy single ID proof */}
                {newCustomerFormData.photoIdProofUrl && (
                  <div className="id-proof-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ flex: '0 0 auto' }}>
                      <img 
                        src={newCustomerFormData.photoIdProofUrl} 
                        alt="ID Proof Preview" 
                        style={{ 
                          width: '60px', 
                          height: '45px', 
                          objectFit: 'cover', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleViewNewCustomerImage(newCustomerFormData.photoIdProofUrl, 'ID Proof (Legacy)')}
                        onError={(e) => {
                          console.error('Legacy ID proof image failed to load:', newCustomerFormData.photoIdProofUrl);
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
                        onClick={() => handleViewNewCustomerImage(newCustomerFormData.photoIdProofUrl, 'ID Proof (Legacy)')}
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
                        onClick={() => setNewCustomerFormData({...newCustomerFormData, photoIdProofUrl: ''})}
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
                {newCustomerFormData.idProofUrls && newCustomerFormData.idProofUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="id-proof-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
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
                        onClick={() => handleViewNewCustomerImage(url, `ID Proof ${index + 1}`)}
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
                        onClick={() => handleViewNewCustomerImage(url, `ID Proof ${index + 1}`)}
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
                          const newIdProofUrls = newCustomerFormData.idProofUrls.filter((_, i) => i !== index);
                          setNewCustomerFormData({...newCustomerFormData, idProofUrls: newIdProofUrls});
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
                  value={newCustomerFormData.remarks}
                  onChange={(e) => setNewCustomerFormData({...newCustomerFormData, remarks: e.target.value})}
                  rows="3"
                  placeholder="Any additional notes about this customer..."
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="mobile-btn mobile-btn-secondary" 
                  onClick={() => {
                    setShowNewCustomerForm(false);
                    resetNewCustomerForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="mobile-btn mobile-btn-primary">
                  ✅ Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal for New Customer */}
      {showNewCustomerImageModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal" style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0 }}>{selectedNewCustomerImageTitle}</h4>
              <button 
                onClick={() => setShowNewCustomerImageModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img 
                src={selectedNewCustomerImageUrl} 
                alt={selectedNewCustomerImageTitle}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh', 
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
                onError={(e) => {
                  console.error('Image failed to load:', selectedNewCustomerImageUrl);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none', padding: '20px', color: '#666' }}>
                Failed to load image
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        className="fab-create-booking"
        onClick={() => {
          resetForm();
          setIsEditing(false);
          setSelectedBooking(null);
          setShowBookingModal(true);
        }}
        title="Create New Booking"
      >
        <span className="fab-icon">+</span>
      </button>
    </div>
  );
};

export default CaretakerBookingScreen;
