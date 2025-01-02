import React, { useState } from 'react';
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

interface Payment {
  id: string;
  date: string;
  amount: number;
  paymentID: string;
  mode: string;
  backupID: string;
  updatedDate: string;
  room: string;
}

const PaymentScreen: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([
    { id: '1', date: '02-01-2025', amount: 4950, paymentID: '1413', mode: 'Online', backupID: '13535', updatedDate: '02-01-2025', room: 'Room1' },
    { id: '2', date: '01-01-2025', amount: 33600, paymentID: '231512', mode: 'Cash', backupID: '51235', updatedDate: '01-01-2025', room: 'Room2' },
    // Add more sample payments here
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const handleSave = () => {
    if (currentPayment) {
      const updatedPayments = currentPayment.id
        ? payments.map((payment) =>
            payment.id === currentPayment.id ? currentPayment : payment
          )
        : [...payments, { ...currentPayment, id: Math.random().toString() }];
      setPayments(updatedPayments);
      setModalVisible(false);
      setCurrentPayment(null);
    }
  };

  const handleEdit = (payment: Payment) => {
    setCurrentPayment(payment);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setPayments(payments.filter((payment) => payment.id !== id));
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.date}</Text>
      <Text style={styles.cell}>{item.amount}</Text>
      <Text style={styles.cell}>{item.room}</Text>
      <Text style={styles.cell}>{item.paymentID}</Text>
      <TouchableOpacity onPress={() => handleEdit(item)}>
        <Text style={styles.link}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Text style={[styles.link, { color: 'red' }]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payments</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setCurrentPayment({
            id: '',
            date: '',
            amount: 0,
            paymentID: '',
            mode: '',
            backupID: '',
            updatedDate: '',
            room: '',
          });
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>Add Payment</Text>
      </TouchableOpacity>
      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerCell}>Date</Text>
            <Text style={styles.headerCell}>Amt</Text>
            <Text style={styles.headerCell}>Room</Text>
            <Text style={styles.headerCell}>Payment ID</Text>
            <Text style={styles.headerCell}>Actions</Text>
          </View>
        }
      />
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Payment Form</Text>
          <Text style={styles.label}>Date*</Text>
          <TouchableOpacity
            onPress={() => setDatePickerVisible(true)}
            style={styles.input}
          >
            <Text>{currentPayment?.date || 'Select Date'}</Text>
          </TouchableOpacity>
          {datePickerVisible && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event: any, date: { toISOString: () => string; }) => {
                if (date) {
                  setCurrentPayment({
                    ...currentPayment!,
                    date: date.toISOString().split('T')[0],
                  });
                }
                setDatePickerVisible(false);
              }}
            />
          )}
          <Text style={styles.label}>Amt*</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={currentPayment?.amount.toString()}
            onChangeText={(value) =>
              setCurrentPayment({
                ...currentPayment!,
                amount: parseFloat(value),
              })
            }
          />
          <Text style={styles.label}>Payment ID*</Text>
          <TextInput
            style={styles.input}
            value={currentPayment?.paymentID}
            onChangeText={(value) =>
              setCurrentPayment({
                ...currentPayment!,
                paymentID: value,
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
          <Text style={styles.label}>Backup ID</Text>
          <TextInput
            style={styles.input}
            value={currentPayment?.backupID}
            onChangeText={(value) =>
              setCurrentPayment({
                ...currentPayment!,
                backupID: value,
              })
            }
          />
          <Text style={styles.label}>Room</Text>
          <TextInput
            style={styles.input}
            value={currentPayment?.room}
            onChangeText={(value) =>
              setCurrentPayment({
                ...currentPayment!,
                room: value,
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
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  addButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontSize: 16 },
  header: { flexDirection: 'row', marginBottom: 8 },
  headerCell: { flex: 1, fontWeight: 'bold' },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  cell: { flex: 1 },
  link: { color: '#007bff', textDecorationLine: 'underline' },
  modalContainer: { flex: 1, padding: 16, backgroundColor: '#fff' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { marginTop: 8, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8, marginVertical: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
});

export default PaymentScreen;
