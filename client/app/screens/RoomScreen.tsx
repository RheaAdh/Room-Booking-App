import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Picker, Alert, Modal } from 'react-native';
import axios from 'axios'; // Import axios

type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUEEN' | 'SINGLE(smaller size)';
type BathroomType = 'ATTACHED' | 'COMMON';

interface Room {
  id: number;
  roomNumber: string;
  roomType: RoomType;
  bathroomType: BathroomType;
  roomMonthlyCost: number;
  roomDailyCost: number;
}

const RoomScreen: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [roomType, setRoomType] = useState<RoomType>('SINGLE');
  const [bathroomType, setBathroomType] = useState<BathroomType>('ATTACHED');
  const [roomMonthlyCost, setRoomMonthlyCost] = useState<number>(0);
  const [roomDailyCost, setRoomDailyCost] = useState<number>(0);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false); // Modal visibility state

  const apiUrl = 'http://localhost:8080/api/v1/rooms';

  // Fetch rooms from backend
  const fetchRooms = async () => {
    try {
      const response = await axios.get(apiUrl); // Use axios instead of fetch
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Save or update room
  const saveRoom = async () => {
    if (!roomNumber || !roomType || !bathroomType || !roomMonthlyCost || !roomDailyCost) {
      Alert.alert("Error", "Please fill out all fields");
      return;
    }

    const roomData: Partial<Room> = {
      roomNumber,
      roomType,
      bathroomType,
      roomMonthlyCost: parseFloat(roomMonthlyCost.toString()),
      roomDailyCost: parseFloat(roomDailyCost.toString()),
    };

    // Include id if updating room
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
    setRoomMonthlyCost(room.roomMonthlyCost);
    setRoomDailyCost(room.roomDailyCost);
    setEditingRoomId(room.id);
    setIsModalVisible(true); // Open modal for editing
  };

  // Reset form
  const resetForm = () => {
    setRoomNumber('');
    setRoomType('SINGLE');
    setBathroomType('ATTACHED');
    setRoomMonthlyCost(0);
    setRoomDailyCost(0);
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

            <Text style={styles.label}>Monthly Room Cost</Text>
            <TextInput
              style={styles.input}
              value={roomMonthlyCost.toString()}
              onChangeText={text => setRoomMonthlyCost(Number(text))}
              placeholder="Enter Monthly Cost"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Daily Room Cost</Text>
            <TextInput
              style={styles.input}
              value={roomDailyCost.toString()}
              onChangeText={text => setRoomDailyCost(Number(text))}
              placeholder="Enter Daily Cost"
              keyboardType="numeric"
            />

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
            <Text style={styles.roomText}>
              {item.roomNumber} | Type: {item.roomType} | Bathroom: {item.bathroomType} 
              | Monthly Cost: {item.roomMonthlyCost} | Daily Cost: {item.roomDailyCost}
            </Text>
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
  },
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default RoomScreen;
