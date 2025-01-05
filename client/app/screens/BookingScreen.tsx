import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';

interface Booking {
  id: number;
  customer: {
    id: string;
    name: string;
  };
  room: {
    roomNumber: string;
    id: string;
    roomDailyCost: number;
    roomMonthlyCost: number;
  };
  checkInDate: string;
  checkOutDate: string;
  payments?: Payment[];
}

interface Payment {
  id: number;
  amount: number;
  createdAt: string;
  mode: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Room {
  id: string;
  roomNumber: string;
   roomDailyCost: number;
    roomMonthlyCost: number;
}

const API_URL_FOR_BOOKINGS = 'http://localhost:8080/api/v1/bookings';
const API_URL_FOR_CUSTOMERS = 'http://localhost:8080/api/v1/customers';
const API_URL_FOR_ROOMS = 'http://localhost:8080/api/v1/rooms';
const API_URL_FOR_PAYMENTS = 'http://localhost:8080/api/v1/payments';

const BookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [createdAt, setCreatedAt] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('');

  const fetchBookings = async () => {
    try {
      const response = await fetch(API_URL_FOR_BOOKINGS);
      const data: Booking[] = await response.json();
      setBookings(data);
      console.log("bookingsList=", data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch bookings.');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(API_URL_FOR_CUSTOMERS);
      const data: Customer[] = await response.json();
      setCustomers(data);
      console.log("customersList=", data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch customers.');
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch(API_URL_FOR_ROOMS);
      const data: Room[] = await response.json();
      setRooms(data);
      console.log("roomsList=", data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch rooms.');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBookings();
      fetchCustomers();
      fetchRooms();
    }, [])
  );

  const handleSaveBooking = async () => {
    if (!selectedCustomer || !selectedRoom || !checkInDate || !checkOutDate) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const bookingData = {
        checkInDate: `${checkInDate}T00:00:00`,
        checkOutDate: `${checkOutDate}T00:00:00`,
        bookingStatus: "NEW",
        customer: { id: selectedCustomer },
        room: { id: selectedRoom },
      };
    
      console.log("save bookingData=", bookingData);
      if (editingBooking) {
        await fetch(`${API_URL_FOR_BOOKINGS}/${editingBooking.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData),
        });
      } else {
        await fetch(API_URL_FOR_BOOKINGS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData),
        });
      }

      fetchBookings();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save booking.');
    }
  };

  const handleSavePayment = async () => {
    if (!paymentAmount || !paymentMode || !editingBooking) {
      Alert.alert('Error', 'Please provide payment details.');
      return;
    }

    try {
      const paymentData = {
        amount: paymentAmount,
        mode: paymentMode,
        bookingId: editingBooking.id ,
        createdAt: `${createdAt}T00:00:00`,
      };

      console.log("save paymentData=", paymentData);

      await fetch(API_URL_FOR_PAYMENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      // Refresh the bookings list after saving the payment
      fetchBookings();
      setPaymentModalVisible(false);  // Close the payment modal
    } catch (error) {
      Alert.alert('Error', 'Failed to save payment.');
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    const formattedCheckInDate = booking.checkInDate.split('T')[0];
    const formattedCheckOutDate = booking.checkOutDate.split('T')[0];

    setSelectedCustomer(booking.customer.id);
    setSelectedRoom(booking.room.id);
    setCheckInDate(formattedCheckInDate);
    setCheckOutDate(formattedCheckOutDate);
    setModalVisible(true);
  };

  const handleDeleteBooking = async (id: number) => {
    try {
      await fetch(`${API_URL_FOR_BOOKINGS}/${id}`, { method: 'DELETE' });
      fetchBookings();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete booking.');
    }
  };
;

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.bookingItem}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingName}>{item.customer.name}</Text>
              <Text style={styles.bookingDetails}>
                Room: {item.room.roomNumber}, Check-in: {item.checkInDate.split('T')[0]}, Check-out: {item.checkOutDate.split('T')[0]}, Cost: {
                  (() => {
                    //if days are >31 then take monthly cost else daily cost
                    const checkInDate = new Date(item.checkInDate);
                    const checkOutDate = new Date(item.checkOutDate);
                    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays > 31) {
                      return item.room.roomMonthlyCost;
                    } else {
                      return item.room.roomDailyCost * diffDays;
                    }
                  })()
                }, Paid: {
                  (() => {
                    let totalAmount = 0;
                    if (item.payments) {
                      totalAmount = item.payments.reduce((acc, payment) => acc + payment.amount, 0);
                    }
                    return totalAmount;
                  })()
                }
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEditBooking(item)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteBooking(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingBooking(item); setPaymentModalVisible(true); }} style={styles.paymentButton}>
                <Text style={styles.paymentButtonText}>Add Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingBooking(null);
          setSelectedCustomer('');
          setSelectedRoom('');
          setCheckInDate('');
          setCheckOutDate('');
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>Add Booking</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Picker
            selectedValue={selectedCustomer}
            onValueChange={(itemValue) => setSelectedCustomer(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select a customer" value="" />
            {customers.map((customer) => (
              <Picker.Item key={customer.id} label={customer.name} value={customer.id} />
            ))}
          </Picker>
          <Picker
            selectedValue={selectedRoom}
            onValueChange={(itemValue) => setSelectedRoom(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select a room" value="" />
            {rooms.map((room) => (
              <Picker.Item key={room.id} label={`Room ${room.roomNumber}`} value={room.id} />
            ))}
          </Picker>
          <TextInput
            style={styles.input}
            placeholder="Check-in Date"
            value={checkInDate}
            onChangeText={setCheckInDate}
          />
          <TextInput
            style={styles.input}
            placeholder="Check-out Date"
            value={checkOutDate}
            onChangeText={setCheckOutDate}
          />
          <TouchableOpacity onPress={handleSaveBooking} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Booking</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={paymentModalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={paymentAmount.toString()}
            onChangeText={(text) => setPaymentAmount(Number(text))}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Created At"
            value={createdAt.toString()}
            onChangeText={(text) => setCreatedAt(text)}
            keyboardType = "numeric"
          />
          <Picker
            selectedValue={paymentMode}
            onValueChange={(itemValue) => setPaymentMode(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Payment Mode" value="" />
            <Picker.Item label="Cash" value="CASH" />
            <Picker.Item label="Credit Card" value="CREDIT_CARD" />
            <Picker.Item label="Debit Card" value="DEBIT_CARD" />
            <Picker.Item label="UPI" value="UPI" />
            <Picker.Item label="Caretaker" value="CARE_TAKER" />
            <Picker.Item label="Net banking" value="NET_BANKING" />
          </Picker>
          <TouchableOpacity onPress={handleSavePayment} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Payment</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontWeight: 'bold',
  },
  bookingDetails: {
    color: '#555',
  },
  actions: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 5,
    margin: 2,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 5,
    margin: 2,
  },
  paymentButton: {
    backgroundColor: '#2196F3',
    padding: 5,
    margin: 2,
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  picker: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  paymentButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default BookingsScreen;
