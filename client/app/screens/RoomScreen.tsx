import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';

import axios from 'axios'; 
import { Picker } from '@react-native-picker/picker';
import {BASE_URL} from '../Constants';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import the icons

type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUEEN' | 'SINGLE(smaller size)';
type BathroomType = 'ATTACHED' | 'COMMON';

interface Room {
  id: number;
  roomNumber: string;
  roomType: RoomType;
  bathroomType: BathroomType;
}

const RoomScreen: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [roomType, setRoomType] = useState<RoomType>('SINGLE');
  const [bathroomType, setBathroomType] = useState<BathroomType>('ATTACHED');
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false); 

  const apiUrl = `${BASE_URL}/rooms`;

  const fetchRooms = async () => {
    try {
      const response = await axios.get(apiUrl); 
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const saveRoom = async () => {
    if (!roomNumber || !roomType || !bathroomType) {
      Alert.alert("Error", "Please fill out all fields");
      return;
    }

    const roomData: Partial<Room> = {
      roomNumber,
      roomType,
      bathroomType
    };

    if (editingRoomId !== null) {
      roomData.id = editingRoomId;
    }

    console.log('Room Data:', roomData);

    let method = 'POST';
    let url = apiUrl;
    if (editingRoomId !== null) {
      method = 'PUT';
      url = `${apiUrl}/${editingRoomId}`;
    }

    try {
      const response = await axios({
        method,
        url,
        data: roomData,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(response);

      if (response.status === 200 || response.status === 201) {
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
  const deleteRoom = async (id: number) => {
    try {
      const response = await axios.delete(`${apiUrl}/${id}`);

      if (response.status === 200) {
        fetchRooms(); // Re-fetch rooms after deletion
      } else {
        console.error('Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  // Start editing room
  const startEditing = (room: Room) => {
    setRoomNumber(room.roomNumber);
    setRoomType(room.roomType);
    setBathroomType(room.bathroomType);
    setEditingRoomId(room.id);
    setIsModalVisible(true); // Open modal for editing
  };

  // Reset form
  const resetForm = () => {
    setRoomNumber('');
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

            <Text style={styles.label}>Room Number</Text>
            <TextInput
              style={styles.input}
              value={roomNumber}
              onChangeText={setRoomNumber}
              placeholder="Enter Room Number"
            />

            <Text style={styles.label}>Room Type</Text>
            <Picker
              selectedValue={roomType}
              style={styles.picker}
              onValueChange={setRoomType}>
              <Picker.Item label="Single" value="SINGLE" />
              <Picker.Item label="SINGLE(smaller size)" value="SINGLE(smaller size)" />
              <Picker.Item label="Double" value="DOUBLE" />
              <Picker.Item label="Triple" value="TRIPLE" />
              <Picker.Item label="Queen" value="QUEEN" />
            </Picker>

            <Text style={styles.label}>Bathroom Type</Text>
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
      <View style={styles.roomInfo}>
        <Text style={styles.roomText}>
          {item.roomNumber} | Type: {item.roomType} | Bathroom: {item.bathroomType}
        </Text>
      </View>
      <View style={styles.iconActions}>
        <TouchableOpacity onPress={() => startEditing(item)}>
          <Icon name="edit" size={24} color="#4CAF50" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteRoom(item.id)}>
          <Icon name="delete" size={24} color="#F44336" style={styles.icon} />
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
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginVertical: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 14,
    color: '#333',
  },
  picker: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
  },
 actions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
},
editButton: {
  flex: 1,
  marginRight: 5, // Add spacing between the two buttons
  backgroundColor: '#4CAF50',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 5,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 3,
  elevation: 3,
},
deleteButton: {
  flex: 1,
  marginLeft: 5, // Add spacing between the two buttons
  backgroundColor: '#F44336',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 5,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 3,
  elevation: 3,
},
buttonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
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
    fontSize: 36,
    color: 'white',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FF6347',
    fontSize: 16,
  },
  roomCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  roomInfo: {
    flex: 1, // Take remaining space
    marginRight: 10, // Add space between info and icons
  },
  roomText: {
    fontSize: 14,
    color: '#333',
  },
  iconActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 10, // Space between icons
  },
});

export default RoomScreen;
