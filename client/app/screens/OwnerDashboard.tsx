import React from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";

// Get screen dimensions to fit dates dynamically
const screenWidth = Dimensions.get("window").width;

// Sample Data
const rooms = [
  { roomNumber: "001-ATA", name: "u1" },
  { roomNumber: "101-AQA", name: "u2" },
  { roomNumber: "102-AQA", name: "u3" },
  { roomNumber: "103-AQA", name: "u4" },
  { roomNumber: "203-BDA", name: "u5" },
];

// Generate dates: Current date + 31 days
const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i <= 31; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    dates.push(nextDate.toLocaleDateString("en-GB")); // Format: DD/MM/YYYY
  }
  return dates;
};

const dates = generateDates();

// Sample Occupancy Data
const occupancy = {
  "001-ATA": { "02/01/2025": { name: "u1", status: "booked" } },
  "101-AQA": {
    "03/01/2025": { name: "u2", status: "booked" },
    "04/01/2025": { name: "u3", status: "booked" },
  },
  "102-AQA": { "06/01/2025": { name: "u4", status: "confirmed" } },
  "103-AQA": { "08/01/2025": { name: "u5", status: "booked" } },
  "203-BDA": {},
};

export default function AvailabilityGrid() {
  const cellWidth = screenWidth / (dates.length + 2); // Adjusting for Room and Name columns

  return (
    <ScrollView horizontal>
      <ScrollView>
        <View>
          {/* Header Row */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerCell, { width: cellWidth }]}>Room</Text>
            <Text style={[styles.cell, styles.headerCell, { width: cellWidth }]}>Name</Text>
            {dates.map((date) => (
              <Text key={date} style={[styles.cell, styles.headerCell, { width: cellWidth }]}>
                {date}
              </Text>
            ))}
          </View>

          {/* Data Rows */}
          {rooms.map((room) => (
            <View key={room.roomNumber} style={styles.row}>
              <Text style={[styles.cell, { width: cellWidth }]}>{room.roomNumber}</Text>
              <Text style={[styles.cell, { width: cellWidth }]}>{room.name}</Text>
              {dates.map((date) => {
                const occupant = occupancy[room.roomNumber]?.[date];
                return (
                  <Text
                    key={`${room.roomNumber}-${date}`}
                    style={[
                      styles.cell,
                      { width: cellWidth },
                      occupant?.status === "booked"
                        ? styles.bookedCell
                        : occupant?.status === "confirmed"
                        ? styles.confirmedCell
                        : styles.emptyCell,
                    ]}
                  >
                    {occupant ? occupant.name : ""}
                  </Text>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRow: {
    backgroundColor: "#ddd",
  },
  cell: {
    padding: 5,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  headerCell: {
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
  },
  bookedCell: {
    backgroundColor: "green",
    color: "white",
  },
  confirmedCell: {
    backgroundColor: "orange",
    color: "black",
  },
  emptyCell: {
    backgroundColor: "grey",
    color: "white",
  },
});
