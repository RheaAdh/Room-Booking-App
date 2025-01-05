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
    roomNumber: ReactNode;
    id: string;
    number: string;
  };
  checkInDate: string;
  checkOutDate: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Room {
  id: string;
  roomNumber: string;
}

const API_URL_FOR_BOOKINGS = 'http://localhost:8080/api/v1/bookings';
const API_URL_FOR_CUSTOMERS = 'http://localhost:8080/api/v1/customers';
const API_URL_FOR_ROOMS = 'http://localhost:8080/api/v1/rooms';

const BookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

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
      customer: { id: selectedCustomer },  // Use customer.id as a string or number depending on your API
      room: { id: selectedRoom },  // Use room.id as a string or number depending on your API
    };
    
console.log("save bookingData=", bookingData);
    if (editingBooking) {
      console.log("editingBooking=", editingBooking);
      console.log("bookingData=", bookingData);
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

    fetchBookings();  // Refresh the bookings list
    setModalVisible(false);  // Close the modal
  } catch (error) {
    Alert.alert('Error', 'Failed to save booking.');
  }
};
  const handleEditBooking = (booking: Booking) => {

    console.log("editbooking=", booking);
  setEditingBooking(booking);
  
  // Ensure that the dates are valid strings before calling split
  const formattedCheckInDate = booking.checkInDate ? booking.checkInDate.split('T')[0] : '';
  const formattedCheckOutDate = booking.checkOutDate ? booking.checkOutDate.split('T')[0] : '';

  setSelectedCustomer(booking.customer.id);
  setSelectedRoom(booking.room.id);
  setCheckInDate(formattedCheckInDate);  // Update state with formatted date
  setCheckOutDate(formattedCheckOutDate);  // Update state with formatted date
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
                Room: {item.room.roomNumber}, Check-in: {item.checkInDate}, Check-out: {item.checkOutDate}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEditBooking(item)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteBooking(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
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
            placeholder="Check-in Date (YYYY-MM-DD)"
            value={checkInDate}
            onChangeText={setCheckInDate}
          />
          <TextInput
            style={styles.input}
            placeholder="Check-out Date (YYYY-MM-DD)"
            value={checkOutDate}
            onChangeText={setCheckOutDate}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveBooking}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  bookingInfo: {
    flex: 3,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingDetails: {
    fontSize: 14,
    color: '#555',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-evenly',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#F44336',
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    marginVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginVertical: 8,
  },
  saveButton: {
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#F44336',
    alignItems: 'center',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default BookingsScreen;
