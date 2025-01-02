import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  ScrollView,
  Image,
} from 'react-native';
import DatePicker from 'react-native-datepicker';

const ContactScreen = () => {
  const [contacts, setContacts] = useState([
    { id: '1', name: 'rhea', mob: '12314134', count: 2 },
    { id: '2', name: 'test1', mob: '322353251', count: 1 },
    // Add more contact objects here.
  ]);

  const [form, setForm] = useState({
    name: '',
    mob: '',
    additionalMob: [] as string[],
    updated: new Date().toISOString(),
  });

  const [showForm, setShowForm] = useState(false);

  const handleSave = () => {
    if (form.name && form.mob) {
      const newContact = {
        id: (contacts.length + 1).toString(),
        name: form.name,
        mob: form.mob,
        count: 1,
      };
      setContacts([...contacts, newContact]);
      resetForm();
      setShowForm(false);
    } else {
      alert('Please fill in the required fields.');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      mob: '',
      additionalMob: [],
      updated: new Date().toISOString(),
    });
  };

  const addAdditionalMob = () => {
    setForm({ ...form, additionalMob: [...form.additionalMob, ''] });
  };

  const updateAdditionalMob = (text: string, index: number) => {
    const updatedMobs = [...form.additionalMob];
    updatedMobs[index] = text;
    setForm({ ...form, additionalMob: updatedMobs });
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactRow}>
      <Text style={styles.contactText}>{item.name}</Text>
      <Text style={styles.contactText}>{item.mob}</Text>
      <Text style={styles.contactText}>{item.count}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <Button title="Add Contact" onPress={() => setShowForm(true)} />
      </View>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        style={styles.contactList}
      />
      {showForm && (
        <ScrollView style={styles.formContainer}>
          <Text style={styles.formTitle}>Contact Form</Text>
          <TextInput
            style={styles.input}
            placeholder="Name *"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Mob *"
            keyboardType="phone-pad"
            value={form.mob}
            onChangeText={(text) => setForm({ ...form, mob: text })}
          />
          {form.additionalMob.map((mob, index) => (
            <TextInput
              key={index}
              style={styles.input}
              placeholder={`Additional Mob ${index + 1}`}
              keyboardType="phone-pad"
              value={mob}
              onChangeText={(text) => updateAdditionalMob(text, index)}
            />
          ))}
          <TouchableOpacity onPress={addAdditionalMob} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Phone</Text>
          </TouchableOpacity>
          <DatePicker
            style={styles.datePicker}
            date={form.updated}
            mode="date"
            placeholder="Select Updated Date"
            format="YYYY-MM-DD"
            confirmBtnText="Confirm"
            cancelBtnText="Cancel"
            onDateChange={(date) => setForm({ ...form, updated: date })}
          />
          <Button title="Save" onPress={handleSave} />
          <Button title="Cancel" onPress={() => setShowForm(false)} color="red" />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  contactList: {
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 5,
    borderRadius: 5,
  },
  contactText: {
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  formTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  datePicker: {
    width: '100%',
    marginBottom: 10,
  },
});

export default ContactScreen;
