import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from '../Constants';

const RoomCostTable: React.FC = () => {
  interface RoomCost {
    id: number;
    bathroomType: string;
    bookingDurationType: string;
    roomType: string;
    cost: number;
  }

  const [roomCosts, setRoomCosts] = useState<RoomCost[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [bathroomType, setBathroomType] = useState('ATTACHED');
  const [bookingDurationType, setBookingDurationType] = useState('DAILY');
  const [roomType, setRoomType] = useState('SINGLE');
  const [cost, setCost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingRoomCost, setEditingRoomCost] = useState<RoomCost | null>(null);

  useEffect(() => {
    fetchRoomCosts();
  }, []);

  const fetchRoomCosts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/roomcost`);
      setRoomCosts(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch room costs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
        console.log("delete");
      await axios.delete(`${BASE_URL}/roomcost/${id}`);
      Alert.alert('Success', 'Room cost deleted successfully!');
      setRoomCosts(roomCosts.filter((room) => room.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete room cost');
    }
  };

  const handleEdit = (roomCost: RoomCost) => {
    setEditingRoomCost(roomCost);
    setBathroomType(roomCost.bathroomType);
    setBookingDurationType(roomCost.bookingDurationType);
    setRoomType(roomCost.roomType);
    setCost(roomCost.cost.toString());
    setModalVisible(true);
  };

  const createOrUpdateRoomCost = async () => {
    if (!cost) {
      Alert.alert('Validation Error', 'Please enter a valid cost.');
      return;
    }

    try {
      const roomCostData = {
        bathroomType,
        bookingDurationType,
        roomType,
        cost: parseInt(cost, 10),
      };

      if (editingRoomCost) {
        // Update existing room cost
        await axios.put(`${BASE_URL}/roomcost/${editingRoomCost.id}`, roomCostData);
        Alert.alert('Success', 'Room cost updated successfully!');
        setRoomCosts(
          roomCosts.map((room) =>
            room.id === editingRoomCost.id ? { ...room, ...roomCostData } : room
          )
        );
      } else {
        // Create new room cost
        const response = await axios.post(`${BASE_URL}/roomcost`, roomCostData);
        Alert.alert('Success', 'Room cost created successfully!');
        setRoomCosts([...roomCosts, response.data]);
      }

      setModalVisible(false);
      setEditingRoomCost(null);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save room cost');
    }
  };

  const resetForm = () => {
    setBathroomType('ATTACHED');
    setBookingDurationType('DAILY');
    setRoomType('SINGLE');
    setCost('');
  };

  const renderItem = ({ item }: { item: RoomCost }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.bathroomType}</Text>
      <Text style={styles.cell}>{item.bookingDurationType}</Text>
      <Text style={styles.cell}>{item.roomType}</Text>
      <Text style={styles.cell}>{item.cost}</Text>
      <TouchableOpacity onPress={() => handleEdit(item)}>
        <Icon name="edit" size={24} color="#4CAF50" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this room cost?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', onPress: () => handleDelete(item.id) },
            ]
          )
        }
      >
        <Icon name="delete" size={24} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerCell}>Bathroom</Text>
        <Text style={styles.headerCell}>Duration</Text>
        <Text style={styles.headerCell}>Room</Text>
        <Text style={styles.headerCell}>Cost</Text>
        <Text style={styles.headerCell}>Actions</Text>
      </View>

      <FlatList
        data={roomCosts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshing={isLoading}
        onRefresh={fetchRoomCosts}
        ListEmptyComponent={<Text style={styles.noDataText}>No data available</Text>}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setEditingRoomCost(null);
          setModalVisible(true);
        }}
      >
        <Icon name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Room Cost</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingRoomCost ? 'Edit Room Cost' : 'Create Room Cost'}
            </Text>

            <Text>Bathroom Type</Text>
            <Picker
              selectedValue={bathroomType}
              onValueChange={(itemValue) => setBathroomType(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Attached" value="ATTACHED" />
              <Picker.Item label="Common" value="COMMON" />
            </Picker>

            <Text>Booking Duration Type</Text>
            <Picker
              selectedValue={bookingDurationType}
              onValueChange={(itemValue) => setBookingDurationType(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Daily" value="DAILY" />
              <Picker.Item label="Monthly" value="MONTHLY" />
            </Picker>

            <Text>Room Type</Text>
            <Picker
              selectedValue={roomType}
              onValueChange={(itemValue) => setRoomType(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Single" value="SINGLE" />
              <Picker.Item label="Double" value="DOUBLE" />
              <Picker.Item label="Triple" value="TRIPLE" />
              <Picker.Item label="Queen" value="QUEEN" />
            </Picker>

            <TextInput
              style={styles.input}
              placeholder="Cost"
              keyboardType="numeric"
              value={cost}
              onChangeText={setCost}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={createOrUpdateRoomCost}
            >
              <Text style={styles.submitButtonText}>
                {editingRoomCost ? 'Update' : 'Submit'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RoomCostTable;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  headerCell: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: '#9E9E9E',
    fontSize: 16,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 3, // Adds a subtle shadow for cards
  },
  cell: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
    textAlign: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    position: 'absolute',
    bottom: 16,
    right: 16,
    elevation: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#424242',
  },
  picker: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    marginVertical: 8,
    borderRadius: 8,
    padding: 4,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    backgroundColor: '#FAFAFA',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
