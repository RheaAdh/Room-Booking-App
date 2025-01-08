import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../Constants';

// Mock API URL
const API_URL = `${BASE_URL}/expenses`;

// Expense interface for TypeScript compatibility
interface Expense {
  id: number;
  name: string;
  description: string;
  amount: number;
  createdAt: string;
}

const ExpenseScreen = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    createdAt: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Fetch expenses from the API
  const fetchExpenses = async () => {
    try {
      const response = await axios.get<Expense[]>(API_URL);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  // Add or update expense
  const handleSubmit = async () => {
    try {
      const { name, description, amount, createdAt } = formData;
      const newExpense = {
        name,
        description,
        amount: parseInt(amount),
        createdAt: `${createdAt}T00:00:00`,
      };

      if (isEditing && editId !== null) {
        // Update existing expense
        const response = await axios.put<Expense>(`${API_URL}/${editId}`, newExpense);
        setExpenses(expenses.map((exp) => (exp.id === editId ? response.data : exp)));
        setIsEditing(false);
      } else {
        // Add new expense
        const response = await axios.post<Expense>(API_URL, newExpense);
        setExpenses([...expenses, response.data]);
      }

      setIsModalVisible(false);
      setFormData({ name: '', description: '', amount: '', createdAt: '' });
    } catch (error) {
      console.error('Error submitting expense:', error);
    }
  };

  // Delete expense
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setExpenses(expenses.filter((exp) => exp.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  // Open modal for adding new expense
  const openAddModal = () => {
    setIsModalVisible(true);
    setIsEditing(false);
    setFormData({ name: '', description: '', amount: '', createdAt: '' });
  };

  // Open modal for editing an existing expense
  const openEditModal = (expense: Expense) => {
    setIsModalVisible(true);
    setIsEditing(true);
    setEditId(expense.id);
    setFormData({
      name: expense.name,
      description: expense.description,
      amount: expense.amount.toString(),
      createdAt: expense.createdAt.split('T')[0], // Extract date only
    });
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <View style={styles.container}>
      {/* Expenses List */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardText}>{item.description}</Text>
              <Text style={styles.cardAmount}>{`Rs. ${item.amount}`}</Text>
              <Text style={styles.cardDate}>
                {item.createdAt ? item.createdAt.split('T')[0] : ''}
              </Text>

            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <MaterialIcons name="edit" size={20} color="#007bff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteIcon}>
                <MaterialIcons name="delete" size={20} color="#d9534f" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add Expense Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <AntDesign name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal for Adding/Editing Expenses */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={formData.amount}
              keyboardType="numeric"
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Created At (YYYY-MM-DD)"
              value={formData.createdAt}
              onChangeText={(text) => setFormData({ ...formData, createdAt: text })}
            />
            <View style={styles.actions}>
              <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
              <Button title={isEditing ? 'Update' : 'Add'} onPress={handleSubmit} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f2f2f2',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteIcon: {
    marginLeft: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default ExpenseScreen;
