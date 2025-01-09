import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Modal,
  Button,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import {BASE_URL} from '../Constants';

const ContactScreen = () => {
  interface Contact {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    email: string | null;
    documentsFolderLink: string | null;
  }

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for modal and form
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    documentsFolderLink: '',
  });

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = () => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/customers`)
      .then((res) => {
        setContacts(res.data);
        setFilteredContacts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = contacts.filter(
        (contact) =>
          (contact.name && contact.name.toLowerCase().includes(lowerQuery)) ||
          (contact.phoneNumber && contact.phoneNumber.includes(lowerQuery))
      );
      setFilteredContacts(filtered);
    }
  };

  const validateLink = (link: string | null): boolean => {
    if (!link) return false;
    const googleDriveRegex = /^https?:\/\/(www\.)?drive\.google\.com\/[a-zA-Z0-9/?=_-]+$/;
    return googleDriveRegex.test(link);
  };

  // Handle Add/Edit Form Submission
  const handleSubmit = () => {
    const { name, phoneNumber, email, documentsFolderLink } = formData;

    // Validate form data
    if (!name || !phoneNumber) {
      Alert.alert('Error', 'Name and Phone Number are required.');
      return;
    }

    if (isEditing && selectedContact) {
      // Editing Contact (PUT Request)
      axios
        .put(`${BASE_URL}/customers/${selectedContact.id}`, formData)
        .then(() => {
          fetchContacts();
          closeModal();
        })
        .catch((err) => console.error(err));
    } else {
      // Adding New Contact (POST Request)
      axios
        .post(`${BASE_URL}/customers`, formData)
        .then(() => {
          fetchContacts();
          closeModal();
        })
        .catch((err) => console.error(err));
    }
  };

  const openAddContact = () => {
    setFormData({ name: '', phoneNumber: '', email: '', documentsFolderLink: '' });
    setIsEditing(false);
    setIsModalVisible(true);
  };

  const openEditContact = (contact: Contact) => {
    setFormData({
      name: contact.name || '',
      phoneNumber: contact.phoneNumber || '',
      email: contact.email || '',
      documentsFolderLink: contact.documentsFolderLink || '',
    });
    setSelectedContact(contact);
    setIsEditing(true);
    setIsModalVisible(true);
  };

  const openDeleteConfirmation = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setFormData({ name: '', phoneNumber: '', email: '', documentsFolderLink: '' });
    setSelectedContact(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setSelectedContact(null);
  };

  const handleDeleteContact = () => {
    if (!selectedContact) return;

    setIsDeleting(true);
    axios
      .delete(`${BASE_URL}//customers/${selectedContact.id}`)
      .then(() => {
        fetchContacts();
        closeDeleteModal();
        setIsDeleting(false);
      })
      .catch((err) => {
        console.error(err);
        setIsDeleting(false);
        closeDeleteModal();
      });
  };

 const renderContact = ({ item }: { item: Contact }) => (
  <View style={styles.contactRow}>
    <TouchableOpacity
      style={styles.contactInfo}
      onPress={() => openEditContact(item)}
    >
      <Text style={styles.contactText}>
        {item.name || 'N/A'} | {item.phoneNumber || 'N/A'}
      </Text>
      
      {/* Show email as text if available */}
      {item.email && (
        <Text
          style={[styles.contactText, styles.email]}
          onPress={() => Linking.openURL(`mailto:${item.email}`)}
        >
          {item.email}
        </Text>
      )}

      {/* Show ID proof link instead of emoji if valid link is present */}
      {item.documentsFolderLink && validateLink(item.documentsFolderLink) && (
        <Text
          style={[styles.contactText, styles.link]}
          onPress={() => Linking.openURL(item.documentsFolderLink!)}
        >
          ID Proof Link
        </Text>
      )}

      <TouchableOpacity onPress={() => openDeleteConfirmation(item)}>
        <Text style={[styles.icon, styles.delete]}>❌</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  </View>
);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone number"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text>Error: {error.message}</Text>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          style={styles.contactList}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={openAddContact}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email (optional)"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Google Drive Link (optional)"
              value={formData.documentsFolderLink}
              onChangeText={(text) => setFormData({ ...formData, documentsFolderLink: text })}
            />
            <View style={styles.buttonContainer}>
              <Button title="Cancel" onPress={closeModal} color="#ff5c5c" />
              <Button title={isEditing ? "Update" : "Add"} onPress={handleSubmit} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={isDeleteModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.deleteConfirmationText}>
              Are you sure you want to delete this contact?
            </Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={closeDeleteModal}
                color="#ff5c5c"
              />
              <Button
                title={isDeleting ? "Deleting..." : "Delete"}
                onPress={handleDeleteContact}
                color="#ff0000"
                disabled={isDeleting}
              />
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
    paddingTop: 20,
  },
  header: {
    padding: 10,
    backgroundColor: '#f4f4f4',
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  contactList: {
    paddingHorizontal: 10,
  },
  contactRow: {
    marginVertical: 8,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    flex: 1,
    fontSize: 16,
  },
  icon: {
    marginLeft: 10,
    fontSize: 18,
  },
  link: {
    color: '#1a73e8',
  },
  delete: {
    color: '#ff5c5c',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  addButtonText: {
    fontSize: 30,
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '80%',
    padding: 20,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  deleteConfirmationText: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default ContactScreen;
