import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList } from 'react-native';

const ExpenseTracker = () => {
  const data = [
    { desc: 'tea', pm: 2916.67, date: '28/03/2024', amt: 35000, category: 'Y' },
    { desc: 'washing powder 4kg', pm: 20.83, date: '29/04/2024', amt: 250, category: 'M' },
  ];



  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Yearly Expense Form</Text>
        <TextInput style={styles.input} placeholder="Date" />
        <TextInput style={styles.input} placeholder="Description" />
        <TextInput style={styles.input} placeholder="Amount" />
        <TextInput style={styles.input} placeholder="Category" />
        <Button title="Add Expense" onPress={() => {}} />
      </View>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.desc}</Text>
            <Text style={styles.cell}>{item.pm}</Text>
            <Text style={styles.cell}>{item.date}</Text>
            <Text style={styles.cell}>{item.amt}</Text>
            <Text style={styles.cell}>{item.category}</Text>
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
  form: {
    marginBottom: 20,
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
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    textAlign: 'center',
  },
});

export default ExpenseTracker;
