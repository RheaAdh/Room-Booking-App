import React, { ReactNode, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../Constants';

interface Arrival {
  bookingStatus: ReactNode;
  customer: any;
  id: number;
  bookingId: number;
  guestName: string;
}

interface Departure {
  bookingStatus: ReactNode;
  customer: any;
  id: number;
  bookingId: number;
  guestName: string;
}

interface Due {
  dueAmount: null;
  booking: any;
  customer: any;
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
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        arrivalsResponse,
        departuresResponse,
        duesResponse
      ] = await Promise.all([
        axios.get<Arrival[]>(`${BASE_URL}/arrivals`),
        axios.get<Departure[]>(`${BASE_URL}/departures`),
        axios.get<Due[]>(`${BASE_URL}/due`)
      ]);
      console.log('dueResponse', duesResponse.data);

      setArrivals(arrivalsResponse.data);
      setDepartures(departuresResponse.data);
      setDues(duesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderList(
        "Today's Arrivals",
        arrivals,
        (item) => item.id.toString(),
        ({ item }: { item: Arrival }) => (
          <View style={styles.listItem}>
            <Text>Booking ID: {item.bookingStatus}</Text>
            <Text>Guest: {item.customer.name}</Text>
            <Text>Phone Number:{item.customer.phoneNumber}</Text>
          </View>
        )
      )}

      {renderList(
        "Today's Departures",
        departures,
        (item) => item.id.toString(),
        ({ item }: { item: Departure }) => (
          <View style={styles.listItem}>
           <Text>Booking ID: {item.bookingStatus}</Text>
            <Text>Guest: {item.customer.name}</Text>
            <Text>Phone Number:{item.customer.phoneNumber}</Text>
          </View>
        )
      )}

      {renderList(
        'Dues to be Collected',
        dues,
        (item) => item.id.toString(),
        ({ item }: { item: Due }) => (
          <View style={styles.listItem}>
            <Text>Guest: {item.customer.name}</Text>
            <Text>Phone Number: {item.customer.phoneNumber}</Text>
            <Text>Due: {item.dueAmount==null? "Oops" : item.dueAmount}</Text>

          </View>
        )
      )}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
