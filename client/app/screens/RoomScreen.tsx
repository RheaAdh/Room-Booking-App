import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RoomScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      const storedRooms = await AsyncStorage.getItem('rooms');
      if (storedRooms) {
        setRooms(JSON.parse(storedRooms));
      }
    };
    fetchRooms();
  }, []);

  const saveRoom = async () => {
    let updatedRooms;
    if (editingRoomId !== null) {
      updatedRooms = rooms.map(room =>
        room.id === editingRoomId ? { ...room, name } : room
      );
    } else {
      const newRoom = { id: rooms.length + 1, name };
      updatedRooms = [...rooms, newRoom];
    }

    setRooms(updatedRooms);
    await AsyncStorage.setItem('rooms', JSON.stringify(updatedRooms));
    setName('');
    setEditingRoomId(null);
  };

  const deleteRoom = async (id: number) => {
    const filteredRooms = rooms.filter(room => room.id !== id);
    setRooms(filteredRooms);
    await AsyncStorage.setItem('rooms', JSON.stringify(filteredRooms));
  };

  const startEditing = (room) => {
    setName(room.name);
    setEditingRoomId(room.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Inventory</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter room name"
      />
      <Button title={editingRoomId !== null ? "Update Room" : "Add Room"} onPress={saveRoom} />
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.room}>
            <Text style={styles.roomText}>{item.name}</Text>
            <Button title="Edit" onPress={() => startEditing(item)} />
            <Button title="Delete" onPress={() => deleteRoom(item.id)} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  room: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  roomText: {
    fontSize: 16,
  },
});

export default RoomScreen;
