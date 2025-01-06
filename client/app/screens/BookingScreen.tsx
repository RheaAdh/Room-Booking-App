import React, { useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from '../Constants';

type Payment = {
  id: string;
  amount: number;
  mode: 'CASH' | 'ONLINE' | 'CREDIT_CARD'; // Added 'CREDIT_CARD'
  createdAt: string;
};

type Room = {
  roomNumber: string;
  roomType: string;
  roomMonthlyCost: number;
};

type Booking = {
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
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE' | 'CREDIT_CARD' | ''>('');
  const [createdAt, setCreatedAt] = useState<string>('');

  useEffect(() => {
    fetchBookings();
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
        amount: parseInt(paymentAmount, 10), // Ensure amount is an integer
        mode: paymentMode as 'CASH' | 'ONLINE' | 'CREDIT_CARD', // Correct mode
        createdAt: formattedCreatedAt, // Ensure this is in proper date-time format
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openPaymentsModal(item)}
            style={styles.bookingItem}
          >
            <Text style={styles.bookingName}>{item.name}</Text>
            <Text style={styles.bookingDetails}>
              Status: {item.bookingStatus} | Check-in: {item.checkInDate} | Check-out: {item.checkOutDate} | {item.room.roomNumber} | {item.room.roomType} | Room Cost: Rs{item.room.roomMonthlyCost}/-
            </Text>
          </TouchableOpacity>
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
                setPaymentMode(itemValue as 'CASH' | 'ONLINE' | 'CREDIT_CARD')
              }
              style={styles.picker}
            >
              <Picker.Item label="Select a mode" value="" />
              <Picker.Item label="CASH" value="CASH" />
              <Picker.Item label="ONLINE" value="ONLINE" />
              <Picker.Item label="CREDIT CARD" value="CREDIT_CARD" />
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
    </View>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f5f5f5' 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  bookingItem: { 
    padding: 15, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    marginBottom: 10, 
    borderRadius: 8, 
    backgroundColor: '#fff',
  },
  bookingName: { 
    fontSize: 18, 
    color: '#333' 
  },
  bookingDetails: { 
    fontSize: 14, 
    color: '#666' 
  },
  modalContent: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  paymentItem: { 
    flexDirection: 'row', 
    marginBottom: 15, 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    backgroundColor: '#e0f7fa'
  },
  paymentInfo: { 
    flex: 2 
  },
  paymentDetails: { 
    fontSize: 16, 
    color: '#333' 
  },
  paymentActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around' 
  },
  deleteButton: { 
    padding: 10, 
    backgroundColor: '#f44336', 
    borderRadius: 8 
  },
  deleteButtonText: { 
    color: '#fff' 
  },
  addPaymentSection: { 
    marginTop: 20, 
    padding: 10, 
    backgroundColor: '#f1f8e9', 
    borderRadius: 8 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 10, 
    backgroundColor: '#fff' 
  },
  picker: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    marginBottom: 10 
  },
  saveButton: { 
    padding: 15, 
    backgroundColor: '#2196f3', 
    borderRadius: 8, 
    marginTop: 10 
  },
  saveButtonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 16 
  },
  cancelButton: { 
    padding: 15, 
    backgroundColor: '#ddd', 
    borderRadius: 8, 
    marginTop: 20 
  },
  cancelButtonText: { 
    textAlign: 'center', 
    fontSize: 16 
  },
  paymentList: { 
    flex: 1, 
    marginTop: 10 
  },
});
