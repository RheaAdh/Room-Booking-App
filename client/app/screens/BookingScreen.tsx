import React, { useState } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Booking {
  id: number;
  name: string;
  date: string;
  details: string;
}

const BookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Partial<Booking>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleAddOrUpdateBooking = () => {
    if (isEditing && currentBooking.id !== undefined) {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === currentBooking.id
            ? { ...booking, ...currentBooking }
            : booking
        )
      );
    } else {
      const newBooking: Booking = {
        id: Date.now(),
        name: currentBooking.name || '',
        date: currentBooking.date || '',
        details: currentBooking.details || '',
      };
      setBookings((prev) => [...prev, newBooking]);
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
    setBookings((prev) => prev.filter((booking) => booking.id !== id));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.bookingItem}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingName}>{item.name}</Text>
              <Text style={styles.bookingDetails}>{item.date}</Text>
              <Text style={styles.bookingDetails}>{item.details}</Text>
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

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={currentBooking.name}
            onChangeText={(text) =>
              setCurrentBooking((prev) => ({ ...prev, name: text }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Date"
            value={currentBooking.date}
            onChangeText={(text) =>
              setCurrentBooking((prev) => ({ ...prev, date: text }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Details"
            value={currentBooking.details}
            onChangeText={(text) =>
              setCurrentBooking((prev) => ({ ...prev, details: text }))
            }
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAddOrUpdateBooking}
          >
            <Text style={styles.saveButtonText}>{isEditing ? 'Update' : 'Add'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setModalVisible(false);
              setCurrentBooking({});
              setIsEditing(false);
            }}
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
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bookingInfo: {
    flex: 1,
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
  },
  actionButton: {
    marginHorizontal: 5,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'black',
  },
});

export default BookingsScreen;
