import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import {BASE_URL} from '../Constants';

interface Arrival {
  id: number;
  bookingId: number;
  guestName: string;
}

interface Departure {
  id: number;
  bookingId: number;
  guestName: string;
}

interface Due {
  id: number;
  guestName: string;
  amount: number;
}

interface RoomAvailability {
  date: string;
  availableRooms: number;
}

interface Stats {
  revenue: number;
  occupancy: number;
  expenses: number;
}

const DashboardScreen: React.FC = () => {
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability[]>([]);
  const [stats, setStats] = useState<Stats>({ revenue: 0, occupancy: 0, expenses: 0 });
  const [loading, setLoading] = useState<boolean>(true);


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const arrivalsResponse = await axios.get<Arrival[]>(`${BASE_URL}/arrivals`);
      const departuresResponse = await axios.get<Departure[]>(`${BASE_URL}/departures`);
      const duesResponse = await axios.get<Due[]>(`${BASE_URL}/payments`);
      const availabilityResponse = await axios.get<RoomAvailability[]>(`${BASE_URL}/room-availability`);
      const statsResponse = await axios.get<Stats>(`${BASE_URL}/stats`);

      setArrivals(arrivalsResponse.data);
      setDepartures(departuresResponse.data);
      setDues(duesResponse.data);
      setRoomAvailability(availabilityResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignRoom = async (bookingId: number, roomId: number) => {
    try {
      await axios.post(`${BASE_URL}/assign-room`, { bookingId, roomId });
      alert(`Room ${roomId} assigned to booking ${bookingId}`);
      fetchDashboardData(); // Refresh data after assignment
    } catch (error) {
      console.error('Error assigning room:', error);
      alert('Failed to assign room. Try again later.');
    }
  };

  const renderList = (
    title: string,
    data: any[],
    keyExtractor: (item: any) => string,
    renderItem: ({ item }: { item: any }) => JSX.Element
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyMessage}>No data available</Text>}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Today's Arrivals */}
      {renderList(
        "Today's Arrivals",
        arrivals,
        (item) => item.id.toString(),
        ({ item }: { item: Arrival }) => (
          <View style={styles.listItem}>
            <Text>Booking ID: {item.bookingId}</Text>
            <Text>Guest: {item.guestName}</Text>
          </View>
        )
      )}

      {/* Today's Departures */}
      {renderList(
        "Today's Departures",
        departures,
        (item) => item.id.toString(),
        ({ item }: { item: Departure }) => (
          <View style={styles.listItem}>
            <Text>Booking ID: {item.bookingId}</Text>
            <Text>Guest: {item.guestName}</Text>
          </View>
        )
      )}

      {/* Dues to be Collected */}
      {renderList(
        'Dues to be Collected',
        dues,
        (item) => item.id.toString(),
        ({ item }: { item: Due }) => (
          <View style={styles.listItem}>
            <Text>Guest: {item.guestName}</Text>
            <Text>Due Amount: ₹{item.amount}</Text>
          </View>
        )
      )}

      {/* Room Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Room Availability</Text>
        <FlatList
          data={roomAvailability}
          horizontal
          keyExtractor={(item) => item.date}
          renderItem={({ item }: { item: RoomAvailability }) => (
            <View style={styles.roomAvailabilityCard}>
              <Text>{item.date}</Text>
              <Text>Available Rooms: {item.availableRooms}</Text>
            </View>
          )}
        />
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Revenue</Text>
            <Text style={styles.statValue}>₹{stats.revenue}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Occupancy</Text>
            <Text style={styles.statValue}>{stats.occupancy}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Expenses</Text>
            <Text style={styles.statValue}>₹{stats.expenses}</Text>
          </View>
        </View>
      </View>

      {/* Assign Room Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assign Room</Text>
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => assignRoom(1, 101)} // Replace with dynamic logic
        >
          <Text style={styles.assignButtonText}>Automate Room Assignment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#888',
    marginTop: 8,
  },
  roomAvailabilityCard: {
    backgroundColor: '#e0f7fa',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statTitle: {
    fontSize: 14,
    color: '#555',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  assignButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
