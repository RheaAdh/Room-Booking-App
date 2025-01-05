import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Modal, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';

// Mock API URL
const API_URL = 'http://localhost:8080/api/v1/expenses';

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
    amount: 0,
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
      const newExpense = { name, description, amount: parseInt(amount), createdAt };

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
      setFormData({ name: '', description: '', amount: 0, createdAt: '' });
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
      createdAt: expense.createdAt,
    });
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Expenses List */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.name}</Text>
            <Text style={styles.cell}>{item.description}</Text>
            <Text style={styles.cell}>{`Rs. ${item.amount}`}</Text>
            <Text style={styles.cell}>{item.createdAt}</Text>
            <View style={styles.actionCell}>
              <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add Expense Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal for Adding/Editing Expenses */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Name (e.g., 201A)"
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#f0ad4e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
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
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
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
    width: '80%',
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
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default ExpenseScreen;
