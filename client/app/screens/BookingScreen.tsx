import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from '../Constants';

type Payment = {
  id: string;
  amount: number;
  mode: 'CASH' | 'ONLINE' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NET_BANKING' | 'CARE_TAKER';
  createdAt: string;
};

type Customer = {
  id: number;
  name: string;
};

type Room = {
  id: number
  roomNumber: string;
  roomType: string;
  roomMonthlyCost: number;
};

type Booking = {
  customer: any;
  checkInDate: string;
  checkOutDate: string;
  room: Room;
  bookingStatus: string;
  id: string;
  name: string;
  payments: Payment[];
};

export default function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<
    'CASH' | 'ONLINE' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NET_BANKING' | 'CARE_TAKER' | ''
  >('');
  const [createdAt, setCreatedAt] = useState<string>('');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookingModalVisible, setBookingModalVisible] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<number>(-1);
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [newBookingCreated, setNewBookingCreated] = useState<boolean>(false);
    const [selectedBookingStatus, setSelectedBookingStatus] = useState<string>('NEW'); // New state for bookingStatus


  useEffect(() => {
    fetchBookings();
    fetchRooms();
    fetchCustomers();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/bookings`);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchPayments = async (bookingId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/bookings/${bookingId}`);
      const updatedBookings = bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, payments: response.data.payments } : booking
      );
      setBookings(updatedBookings);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const openPaymentsModal = (booking: Booking) => {
    setSelectedBooking(booking);
    fetchPayments(booking.id);
    setPaymentModalVisible(true);
  };

  const closePaymentsModal = () => {
    setPaymentModalVisible(false);
    resetPaymentForm();
  };

  const handleSavePayment = async () => {
    if (!selectedBooking) return;

    const formattedCreatedAt = `${createdAt}T00:00:00`;

    try {
      const response = await axios.post(`${BASE_URL}/payments`, {
        bookingId: selectedBooking.id,
        amount: parseInt(paymentAmount, 10),
        mode: paymentMode as 'CASH' | 'ONLINE' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NET_BANKING' | 'CARE_TAKER',
        createdAt: formattedCreatedAt,
      });

      const newPayment: Payment = response.data;

      setSelectedBooking({
        ...selectedBooking,
        payments: [...selectedBooking.payments, newPayment],
      });
      resetPaymentForm();
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!selectedBooking) return;

    try {
      await axios.delete(`${BASE_URL}/payments/${paymentId}`);

      const updatedPayments = selectedBooking.payments.filter(
        (payment) => payment.id !== paymentId
      );

      setSelectedBooking({ ...selectedBooking, payments: updatedPayments });
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

const handleEditBooking = (bookingId: string) => {
  // Find the booking details to edit
  const bookingToEdit = bookings.find((booking) => booking.id === bookingId);
  
  if (bookingToEdit) {
    setSelectedBooking(bookingToEdit);
    setSelectedRoom(bookingToEdit.room.id);
    setSelectedCustomer(bookingToEdit.customer.id);
    setCheckInDate(bookingToEdit.checkInDate.split('T')[0]); // Convert to 'YYYY-MM-DD'
    setCheckOutDate(bookingToEdit.checkOutDate.split('T')[0]); // Convert to 'YYYY-MM-DD'
    setBookingModalVisible(true);  // Open the booking modal
  }
  
};
// Function to create a new booking
const handleCreateNewBooking = async () => {
  if (!selectedRoom || !selectedCustomer || !checkInDate || !checkOutDate) {
    alert('Please fill all the fields');
    return;
  }

  const formattedCheckInDate = `${checkInDate}T00:00:00`;
  const formattedCheckOutDate = `${checkOutDate}T00:00:00`;

  try {
    // Create a new booking using POST
    const response = await axios.post(`${BASE_URL}/bookings`, {
      checkInDate: formattedCheckInDate,
      checkOutDate: formattedCheckOutDate,
      bookingStatus: 'NEW', // Default to 'NEW' for new bookings
      customer: { id: selectedCustomer },
      room: { id: selectedRoom },
    });

    alert('Booking created successfully!');
    setBookings((prevBookings) => [...prevBookings, response.data]);
    closeBookingModal();
  } catch (error) {
    console.error('Error creating booking:', error);
    alert('Failed to create booking');
  }
};
  const bookingStatuses = ['NEW', 'PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'];

const handleSaveUpdatedBooking = async () => {
  if (!selectedRoom || !selectedCustomer || !checkInDate || !checkOutDate) {
    alert('Please fill all the fields');
    return;
  }

  const formattedCheckInDate = `${checkInDate}T00:00:00`;
  const formattedCheckOutDate = `${checkOutDate}T00:00:00`;

  try {
    let response;

    if (selectedBooking) {
      // Update the existing booking using PUT
      response = await axios.put(`${BASE_URL}/bookings/${selectedBooking.id}`, {
        checkInDate: formattedCheckInDate,
        checkOutDate: formattedCheckOutDate,
        bookingStatus: selectedBookingStatus, // Send the selected booking status
        customer: { id: selectedCustomer },
        room: { id: selectedRoom },
      });

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === selectedBooking.id ? { ...booking, ...response.data } : booking
        )
      );

      alert('Booking updated successfully!');

      // clear the state
      setSelectedBooking(null);
      setSelectedRoom(0);
      setSelectedCustomer(0);
      setCheckInDate('');
      setCheckOutDate('');
      setBookingModalVisible(false);

    }
    setBookingModalVisible(false);
  } catch (error) {
    console.error('Error saving booking:', error);
    alert('Failed to save booking');
  }
};

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await axios.delete(`${BASE_URL}/bookings/${bookingId}`);
      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMode('');
    setCreatedAt('');
  };

  const saveUpdatedBooking = () => {
    if (!selectedBooking) return;

    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === selectedBooking.id ? { ...selectedBooking } : booking
      )
    );
    closePaymentsModal();
  };
  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

 const handleCreateBooking = async () => {
  if (!selectedRoom || !selectedCustomer || !checkInDate || !checkOutDate) {
    alert('Please fill all the fields');
    return;
  }

  console.log('Creating booking:', selectedRoom, selectedCustomer, checkInDate, checkOutDate);

  // Ensure the dates are in the required format (YYYY-MM-DDTHH:MM:SS)
  const formattedCheckInDate = `${checkInDate}T00:00:00`;
  const formattedCheckOutDate = `${checkOutDate}T00:00:00`;

  try {
    // Send the request with the updated format
    const response = await axios.post(`${BASE_URL}/bookings`, {
      checkInDate: formattedCheckInDate, 
      checkOutDate: formattedCheckOutDate,
      bookingStatus: 'NEW', // Static value as per request format
      customer: { id: selectedCustomer },  // Sending the customer as an object with an ID
      room: { id: selectedRoom }  // Sending the room as an object with an ID
    });
    console.log(response.data);

    alert('Booking created successfully!');
    setNewBookingCreated(true);
    closeBookingModal();
  } catch (error) {
    console.error('Error creating booking:', error);
    alert('Failed to create booking');
  }
};

  const openBookingModal = () => {
    setBookingModalVisible(true);
  };

  const closeBookingModal = () => {
    setBookingModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedRoom(0)
    setSelectedCustomer(0)
    setCheckInDate('');
    setCheckOutDate('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.bookingItem}>
            <View style={styles.bookingDetailsContainer}>
              <Text style={styles.bookingName}>{item.name}</Text>
              <Text style={styles.bookingDetails}>
                Status: {item.bookingStatus} | Check-in: {item.checkInDate} | Check-out: {item.checkOutDate} | {item.room.roomNumber} | {item.room.roomType}
              </Text>
            </View>

            {/* Container for Payments and Delete buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => openPaymentsModal(item)}
                style={styles.paymentButton}
              >
                <Text style={styles.paymentButtonText}>Payments</Text>
              </TouchableOpacity>
             <TouchableOpacity
                onPress={() => handleEditBooking(item.id)}
                style={styles.editButton}
              >
                <Text>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteBooking(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={paymentModalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Payments for Booking: {selectedBooking?.name}
          </Text>

          <View style={styles.addPaymentSection}>
            <Text style={styles.sectionTitle}>Add Payment</Text>
            <TextInput
              placeholder="Payment Amount"
              value={paymentAmount}
              onChangeText={(value) => setPaymentAmount(value)}
              style={styles.input}
              keyboardType="numeric"
            />
            <Picker
              selectedValue={paymentMode}
              onValueChange={(itemValue) =>
                setPaymentMode(itemValue as 'CASH' | 'ONLINE' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NET_BANKING' | 'CARE_TAKER')
              }
              style={styles.picker}
            >
              <Picker.Item label="Select a mode" value="" />
              <Picker.Item label="CREDIT CARD" value="CREDIT_CARD" />
              <Picker.Item label="DEBIT CARD" value="DEBIT_CARD" />
              <Picker.Item label="UPI" value="UPI" />
              <Picker.Item label="CASH" value="CASH" />
              <Picker.Item label="NET BANKING" value="NET_BANKING" />
              <Picker.Item label="CARE TAKER" value="CARE_TAKER" />
            </Picker>
            <TextInput
              placeholder="Payment Date (YYYY-MM-DD)"
              value={createdAt}
              onChangeText={setCreatedAt}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={handleSavePayment}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save Payment</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.paymentList}>
            {selectedBooking?.payments?.length ? (
              selectedBooking.payments.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentDetails}>
                      Amount: ₹{payment.amount} | Mode: {payment.mode}
                    </Text>
                    <Text style={styles.paymentDetails}>
                      Date: {payment.createdAt}
                    </Text>
                  </View>
                  <View style={styles.paymentActions}>
                    <TouchableOpacity
                      onPress={() => handleDeletePayment(payment.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text>No payments found for this booking.</Text>
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={saveUpdatedBooking}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
       {/* Modal for Booking Form */}
<Modal visible={bookingModalVisible} animationType="slide">
  <View style={styles.modalContent}>
    <Text style={styles.modalTitle}>Edit Booking</Text>

    {/* Select Room */}
    <Text style={styles.label}>Select Room</Text>
    <Picker
      selectedValue={selectedRoom}
      onValueChange={(itemValue) => setSelectedRoom(itemValue)}
      style={styles.picker}
    >
      <Picker.Item label="Select Room" value="" />
      {rooms.map((room) => (
        <Picker.Item key={room.id} label={`${room.roomNumber} - ${room.roomType}`} value={room.id} />
      ))}
    </Picker>

    {/* Select Customer */}
    <Text style={styles.label}>Select Customer</Text>
    <Picker
      selectedValue={selectedCustomer}
      onValueChange={(itemValue) => setSelectedCustomer(itemValue)}
      style={styles.picker}
    >
      <Picker.Item label="Select Customer" value="" />
      {customers.map((customer) => (
        <Picker.Item key={customer.id} label={customer.name} value={customer.id} />
      ))}
    </Picker>

    {/* Select Booking Status */}
          <Text style={styles.label}>Booking Status</Text>
          <Picker
            selectedValue={selectedBookingStatus}
            onValueChange={(itemValue) => setSelectedBookingStatus(itemValue)}
            style={styles.picker}
          >
            {bookingStatuses.map((status) => (
              <Picker.Item key={status} label={status} value={status} />
            ))}
          </Picker>

    {/* Check-in Date */}
    <Text style={styles.label}>Check-in Date</Text>
    <TextInput
      value={checkInDate}
      onChangeText={setCheckInDate}
      style={styles.input}
      placeholder="YYYY-MM-DD"
    />

    {/* Check-out Date */}
    <Text style={styles.label}>Check-out Date</Text>
    <TextInput
      value={checkOutDate}
      onChangeText={setCheckOutDate}
      style={styles.input}
      placeholder="YYYY-MM-DD"
    />


    {/* Submit Button to Save Changes */}
   <TouchableOpacity onPress={selectedBooking ? handleSaveUpdatedBooking : handleCreateBooking} style={styles.saveButton}>
  <Text style={styles.saveButtonText}>
    {selectedBooking ? 'Save Changes' : 'Create Booking'}
  </Text>
</TouchableOpacity>

    {/* Close Button */}
    <TouchableOpacity onPress={closeBookingModal} style={styles.cancelButton}>
      <Text style={styles.cancelButtonText}>Close</Text>
    </TouchableOpacity>
  </View>
</Modal>

           
 <TouchableOpacity style={styles.fab} onPress={openBookingModal}>
              <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
    </View>
    
  );
}

const styles = StyleSheet.create({
 container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  fab: {
  backgroundColor: '#007bff',
  borderRadius: 50,
  width: 60,
  height: 60,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  bottom: 20,
  right: 20,
  zIndex: 100, // Add zIndex to ensure it stays on top
},
  fabText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  bookingItem: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  bookingDetailsContainer: {
    marginBottom: 10,
  },
  bookingName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  bookingDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  paymentButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#f39c12',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  addPaymentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 10,
    fontSize: 16,
  },
  picker: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentList: {
    marginTop: 20,
  },
  paymentItem: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDetails: {
    fontSize: 14,
    color: '#333',
  },
  paymentActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
});
