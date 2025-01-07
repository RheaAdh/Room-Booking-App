import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, FlatList } from "react-native";
import axios from "axios";
import { BASE_URL } from "../Constants";

// Define types for API response
interface Booking {
  room: { id: number; roomNumber: string };
  customer: { id: number; name: string };
  checkInDate: string;
  checkOutDate: string;
}

const BookingGrid: React.FC = () => {
  const [rooms, setRooms] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [gridData, setGridData] = useState<string[][]>([]);

  useEffect(() => {
    fetchBookingData();
  }, []);

  const fetchBookingData = async () => {
    try {
      // Fetch bookings from the API
      const response = await axios.get<Booking[]>(`${BASE_URL}/bookings`);
      const bookings = response.data;

      // Generate dates dynamically
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const allDates: string[] = [];
      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        allDates.push(new Date(d).toISOString().split("T")[0]);
      }
      setDates(allDates);

      // Extract rooms and prepare grid data
      const roomMap: Record<string, string[]> = {};
      bookings.forEach(({ room, customer, checkInDate, checkOutDate }) => {
        if (!roomMap[room.roomNumber]) {
          roomMap[room.roomNumber] = Array(allDates.length).fill("");
        }

        allDates.forEach((date, index) => {
          if (date >= checkInDate && date < checkOutDate) {
            roomMap[room.roomNumber][index] = customer.name;
          }
        });
      });

      setRooms(Object.keys(roomMap));
      setGridData(Object.values(roomMap));
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const renderCell = (text: string) => (
    <View style={styles.cell}>
      <Text style={styles.cellText}>{text || ""}</Text>
    </View>
  );

  const renderRow = (row: string[], room: string) => (
    <View style={styles.row}>
      <View style={[styles.cell, styles.roomCell]}>
        <Text style={styles.roomText}>{room}</Text>
      </View>
      {row.map((customer, index) => (
        <React.Fragment key={index}>{renderCell(customer)}</React.Fragment>
      ))}
    </View>
  );

  return (
    <ScrollView horizontal>
      <View>
        {/* Table Header */}
        <View style={styles.row}>
          <View style={[styles.cell, styles.header]}>
            <Text style={styles.headerText}>Room</Text>
          </View>
          {dates.map((date, index) => (
            <View key={index} style={[styles.cell, styles.header]}>
              <Text style={styles.headerText}>
                {date.split("-")[2]}-{date.split("-")[1]}
              </Text>
            </View>
          ))}
        </View>

        {/* Table Body */}
        <FlatList
          data={rooms}
          keyExtractor={(item) => item}
          renderItem={({ item, index }) => renderRow(gridData[index], item)}
          contentContainerStyle={styles.tableBody}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  cell: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  header: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  headerText: {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 12,
  },
  roomCell: {
    backgroundColor: "#d9f9d9",
  },
  roomText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  cellText: {
    fontSize: 12,
    textAlign: "center",
  },
  tableBody: {
    marginBottom: 10,
  },
});

export default BookingGrid;
