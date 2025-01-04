import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Button,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

interface Payment {
  id?: number;
  amount: number;
  createdAt: string;
  mode: string;
  bookingId: number; // Reference to booking
}

const API_URL = 'http://your-backend-url.com/payments'; // Replace with actual backend URL

const PaymentScreen: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (currentPayment) {
      try {
        if (currentPayment.id) {
          // Update existing payment
          await axios.put(`${API_URL}/${currentPayment.id}`, currentPayment);
          setPayments((prev) =>
            prev.map((payment) =>
              payment.id === currentPayment.id ? currentPayment : payment
            )
          );
        } else {
          // Create new payment
          const response = await axios.post(API_URL, currentPayment);
          setPayments((prev) => [...prev, response.data]);
        }
        setModalVisible(false);
        setCurrentPayment(null);
      } catch (error) {
        console.error('Error saving payment:', error);
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setPayments((prev) => prev.filter((payment) => payment.id !== id));
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const handleEdit = (payment: Payment) => {
    setCurrentPayment(payment);
    setModalVisible(true);
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.createdAt}</Text>
      <Text style={styles.cell}>{item.amount}</Text>
      <Text style={styles.cell}>{item.mode}</Text>
      <Text style={styles.cell}>{item.bookingId}</Text>
      <TouchableOpacity onPress={() => handleEdit(item)}>
        <Text style={styles.link}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.id!)}>
        <Text style={[styles.link, { color: 'red' }]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payments</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setCurrentPayment({
            amount: 0,
            createdAt: '',
            mode: '',
            bookingId: 0,
          });
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>Add Payment</Text>
      </TouchableOpacity>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPayment}
          keyExtractor={(item) => item.id?.toString() || ''}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Amount</Text>
              <Text style={styles.headerCell}>Mode</Text>
              <Text style={styles.headerCell}>Booking ID</Text>
              <Text style={styles.headerCell}>Actions</Text>
            </View>
          }
        />
      )}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Payment Form</Text>
          <Text style={styles.label}>Date*</Text>
          <TouchableOpacity
            onPress={() => setDatePickerVisible(true)}
            style={styles.input}
          >
            <Text>{currentPayment?.createdAt || 'Select Date'}</Text>
          </TouchableOpacity>
          {datePickerVisible && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event: any, date?: Date) => {
                if (date) {
                  setCurrentPayment({
                    ...currentPayment!,
                    createdAt: date.toISOString().split('T')[0],
                  });
                }
                setDatePickerVisible(false);
              }}
            />
          )}
          <Text style={styles.label}>Amount*</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={currentPayment?.amount.toString()}
            onChangeText={(value) =>
              setCurrentPayment({
                ...currentPayment!,
                amount: parseInt(value, 10),
              })
            }
          />
          <Text style={styles.label}>Mode*</Text>
          <TextInput
            style={styles.input}
            value={currentPayment?.mode}
            onChangeText={(value) =>
              setCurrentPayment({
                ...currentPayment!,
                mode: value,
              })
            }
          />
          <Text style={styles.label}>Booking ID*</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={currentPayment?.bookingId.toString()}
            onChangeText={(value) =>
              setCurrentPayment({
                ...currentPayment!,
                bookingId: parseInt(value, 10),
              })
            }
          />
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
            <Button title="Save" onPress={handleSave} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#343a40',
  },
  addButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cell: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
    textAlign: 'center',
  },
  link: {
    fontSize: 14,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 8,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#343a40',
    flex: 1,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#343a40',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#495057',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});

export default PaymentScreen;
