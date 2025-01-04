import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Picker, Alert, Modal } from 'react-native';

const RoomScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [capacity, setCapacity] = useState('');
  const [roomType, setRoomType] = useState('SINGLE');
  const [bathroomType, setBathroomType] = useState('ATTACHED');
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state

  const apiUrl = 'http://localhost:8080/api/v1/rooms';

  // Fetch rooms from backend
  const fetchRooms = async () => {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Save or update room
  const saveRoom = async () => {
    if (!roomNumber || !floor || !capacity) {
      Alert.alert("Error", "Please fill out all fields");
      return;
    }

    const roomData = {
      roomNumber,
      floor: parseInt(floor),
      capacity: parseInt(capacity),
      roomType,
      bathroomType,
    };

    let method = 'POST';
    let url = apiUrl;
    if (editingRoomId !== null) {
      method = 'PUT';
      url = `${apiUrl}/${editingRoomId}`;
      roomData.id = editingRoomId;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });

      if (response.ok) {
        fetchRooms(); // Re-fetch rooms after save
        resetForm();
        setIsModalVisible(false); // Close modal after saving
      } else {
        console.error('Failed to save room');
      }
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  // Delete room
  const deleteRoom = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRooms(); // Re-fetch rooms after deletion
      } else {
        console.error('Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  // Start editing room
  const startEditing = (room) => {
    setRoomNumber(room.roomNumber);
    setFloor(room.floor.toString());
    setCapacity(room.capacity.toString());
    setRoomType(room.roomType);
    setBathroomType(room.bathroomType);
    setEditingRoomId(room.id);
    setIsModalVisible(true); // Open modal for editing
  };

  // Reset form
  const resetForm = () => {
    setRoomNumber('');
    setFloor('');
    setCapacity('');
    setRoomType('SINGLE');
    setBathroomType('ATTACHED');
    setEditingRoomId(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Inventory</Text>

      {/* Modal for Adding/Editing Rooms */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingRoomId !== null ? 'Edit Room' : 'Add Room'}
            </Text>

            <TextInput
              style={styles.input}
              value={roomNumber}
              onChangeText={setRoomNumber}
              placeholder="Room Number (e.g., 201A)"
            />
            <TextInput
              style={styles.input}
              value={floor}
              onChangeText={setFloor}
              placeholder="Floor"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={capacity}
              onChangeText={setCapacity}
              placeholder="Capacity"
              keyboardType="numeric"
            />
            <Picker
              selectedValue={roomType}
              style={styles.picker}
              onValueChange={setRoomType}>
              <Picker.Item label="Single" value="SINGLE" />
              <Picker.Item label="Double" value="DOUBLE" />
              <Picker.Item label="Triple" value="TRIPLE" />
              <Picker.Item label="Queen" value="QUEEN" />
            </Picker>
            <Picker
              selectedValue={bathroomType}
              style={styles.picker}
              onValueChange={setBathroomType}>
              <Picker.Item label="Attached" value="ATTACHED" />
              <Picker.Item label="Common" value="COMMON" />
            </Picker>
            <Button
              title={editingRoomId !== null ? "Update Room" : "Add Room"}
              onPress={saveRoom}
              color="#4CAF50"
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                resetForm();
                setIsModalVisible(false); // Close modal on cancel
              }}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.roomCard}>
            <Text style={styles.roomText}>{item.roomNumber} | Floor: {item.floor} | Capacity: {item.capacity} | Type: {item.roomType} | Bathroom: {item.bathroomType}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => startEditing(item)} style={styles.editButton}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteRoom(item.id)} style={styles.deleteButton}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalVisible(true)} // Open modal on press
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  closeButton: {
    backgroundColor: '#F44336',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  roomCard: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  roomText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 30,
    color: '#fff',
  },
});

export default RoomScreen;
