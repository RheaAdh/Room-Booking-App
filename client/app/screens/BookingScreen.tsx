import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Picker,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  durationType: string;
  bookingStatus: string;
  customer: {
    id: number;
    name: string;
  };
  room: {
    id: number;
    name: string;
  };
}

interface Room {
  id: number;
  name: string;
}

const BookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Partial<Booking>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]); // Holds customer list
  const [rooms, setRooms] = useState<any[]>([]); // Holds room list
  const [statusOptions] = useState(['NEW', 'CONFIRMED', 'CANCELLED']); // Dropdown for booking status
  const [duration, setDuration] = useState(0); // Duration in days

  useEffect(() => {
    // Fetch bookings from the API
    axios
      .get('http://localhost:8080/api/v1/bookings')
      .then((response) => {
        setBookings(response.data);
      })
      .catch((error) => {
        console.error('Error fetching bookings:', error);
      });

    // Fetch customers and rooms for selection in the modal
    axios
      .get('http://localhost:8080/api/v1/customers')
      .then((response) => {
        setCustomers(response.data);
      })
      .catch((error) => {
        console.error('Error fetching customers:', error);
      });

    axios
      .get('http://localhost:8080/api/v1/rooms')
      .then((response) => {
        setRooms(response.data);
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
      });
  }, []);

  const handleAddOrUpdateBooking = () => {
    const newBooking: Booking = {
      id: currentBooking.id ?? Date.now(),
      startDate: currentBooking.startDate || '',
      endDate: currentBooking.endDate || '',
      bookingStatus: currentBooking.bookingStatus || 'NEW',
      durationType: 'DAYS',
      customer: currentBooking.customer || { id: 1, name: '' },
      room: currentBooking.room || { id: 1, name: '' },
    };

    const durationInDays = Math.ceil(
      (new Date(currentBooking.endDate!).getTime() - new Date(currentBooking.startDate!).getTime()) /
        (1000 * 3600 * 24)
    );
    newBooking.durationType = `${durationInDays} Days`; // Set duration in days

    // Send the data to the API to save it to the backend
    if (isEditing && currentBooking.id !== undefined) {
      axios
        .put(`http://localhost:8080/api/v1/bookings/${newBooking.id}`, newBooking)
        .then((response) => {
          // Update the booking list with the updated data
          setBookings((prevBookings) =>
            prevBookings.map((booking) =>
              booking.id === newBooking.id ? response.data : booking
            )
          );
        })
        .catch((error) => {
          console.error('Error updating booking:', error);
        });
    } else {
      axios
        .post('http://localhost:8080/api/v1/bookings', newBooking)
        .then((response) => {
          // Add the new booking to the list
          setBookings((prevBookings) => [...prevBookings, response.data]);
        })
        .catch((error) => {
          console.error('Error adding booking:', error);
        });
    }

    setModalVisible(false);
    setCurrentBooking({});
    setIsEditing(false);
  };

  const handleEditBooking = (booking: Booking) => {
    setCurrentBooking(booking);
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleDeleteBooking = (id: number) => {
    axios
      .delete(`http://localhost:8080/api/v1/bookings/${id}`)
      .then(() => {
        setBookings((prevBookings) => prevBookings.filter((booking) => booking.id !== id));
      })
      .catch((error) => {
        console.error('Error deleting booking:', error);
      });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setModalVisible(true);
          setIsEditing(false); // Reset to add mode when opening modal
        }}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.bookingItem}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingName}>{item.customer.name}</Text>
              <Text style={styles.bookingDetails}>
                {item.startDate} - {item.endDate}
              </Text>
              <Text style={styles.bookingDetails}>Duration: {item.durationType}</Text>
              <Text style={styles.bookingDetails}>Status: {item.bookingStatus}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditBooking(item)}
              >
                <Ionicons name="pencil" size={20} color="blue" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteBooking(item.id)}
              >
                <Ionicons name="trash" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <TextInput
            style={styles.input}
            placeholder="Start Date"
            value={currentBooking.startDate}
            onChangeText={(text) =>
              setCurrentBooking((prev) => ({ ...prev, startDate: text }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="End Date"
            value={currentBooking.endDate}
            onChangeText={(text) =>
              setCurrentBooking((prev) => ({ ...prev, endDate: text }))
            }
          />
          <Picker
            selectedValue={currentBooking.bookingStatus}
            style={styles.input}
            onValueChange={(itemValue: any) =>
              setCurrentBooking((prev) => ({ ...prev, bookingStatus: itemValue }))
            }
          >
            {statusOptions.map((status) => (
              <Picker.Item label={status} value={status} key={status} />
            ))}
          </Picker>
          <Picker
            selectedValue={currentBooking.customer?.id}
            style={styles.input}
            onValueChange={(itemValue: any) =>
              setCurrentBooking((prev) => ({
                ...prev,
                customer: customers.find((c) => c.id === itemValue),
              }))
            }
          >
            {customers.map((customer) => (
              <Picker.Item label={customer.name} value={customer.id} key={customer.id} />
            ))}
          </Picker>
          <Picker
            selectedValue={currentBooking.room?.id}
            style={styles.input}
            onValueChange={(itemValue: number) =>
              setCurrentBooking((prev) => ({
                ...prev,
                room: rooms.find((r) => r.id === itemValue),
              }))
            }
          >
            {rooms.map((room: Room) => (
              <Picker.Item label={room.name} value={room.id} key={room.id} />
            ))}
          </Picker>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAddOrUpdateBooking}
          >
            <Text style={styles.saveButtonText}>{isEditing ? 'Update' : 'Add'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
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
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    borderRadius: 50,
    padding: 10,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookingDetails: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 10,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default BookingsScreen;
