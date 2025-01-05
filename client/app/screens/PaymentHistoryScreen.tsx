import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

interface Payment {
  id: number;
  amount: number;
  createdAt: string;
  mode: string;
  bookingId: number;
}

const API_URL = 'http://localhost:8080/api/v1/payments'; // Replace with actual backend URL

const PaymentHistoryScreen: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch all payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payments when the component is mounted
  useEffect(() => {
    fetchPayments();
  }, []);

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.createdAt}</Text>
      <Text style={styles.cell}>{item.amount}</Text>
      <Text style={styles.cell}>{item.mode}</Text>
      <Text style={styles.cell}>{item.bookingId}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Amount</Text>
              <Text style={styles.headerCell}>Mode</Text>
              <Text style={styles.headerCell}>Booking ID</Text>
            </View>
          }
        />
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f1f1f1',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  headerCell: {
    fontSize: 16,
    color: '#495057',
    flex: 1,
    textAlign: 'center',
  },
});

export default PaymentHistoryScreen;
