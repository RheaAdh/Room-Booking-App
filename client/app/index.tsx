import React from "react";
import { Text, View, FlatList, Button, TextInput, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";

function AuthenticationScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Button
        title="Login as Caretaker"
        onPress={() => navigation.replace("Caretaker")}
      />
      <Button
        title="Login as Owner"
        onPress={() => navigation.replace("Owner")}
      />
    </View>
  );
}

function CaretakerDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caretaker Dashboard</Text>
      <Text>Today's Arrivals: 2</Text>
      <Text>Today's Departures: 3</Text>
      <Text>Dues to be Collected: ₹5000</Text>
    </View>
  );
}

function OwnerDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Owner Dashboard</Text>
      <Text>Room Availability (Day Wise)</Text>
      {/* Add a calendar view or availability grid here */}
    </View>
  );
}

function AssignRoom() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign Room</Text>
      <Text>Select Booking</Text>
      {/* Add a dropdown for bookings */}
      <Text>Select Room</Text>
      {/* Add a dropdown for rooms based on availability */}
      <Button title="Assign Room" onPress={() => alert("Room Assigned")} />
    </View>
  );
}

function Notifications() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text>Upcoming Arrivals: 2</Text>
      <Text>Upcoming Departures: 1</Text>
      <Text>Overdue Payments: 3</Text>
    </View>
  );
}

function Analytics() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <Text>Revenue: ₹50,000</Text>
      <Text>Occupancy Rate: 85%</Text>
      <Text>Total Expenses: ₹20,000</Text>
    </View>
  );
}

function CRUDScreen({ title, placeholder, dataKey }: { title: string; placeholder: string; dataKey: string }) {
  const [data, setData] = React.useState<{ id: string; [key: string]: string }[]>([]);
  const [input, setInput] = React.useState("");

  const addItem = () => {
    setData([...data, { id: Date.now().toString(), [dataKey]: input }]);
    setInput("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={input}
        onChangeText={setInput}
      />
      <Button title={`Add ${title}`} onPress={addItem} />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item[dataKey]}</Text>
          </View>
        )}
      />
    </View>
  );
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function CaretakerTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={CaretakerDashboard} />
    </Tab.Navigator>
  );
}

function OwnerTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={OwnerDashboard} />
      <Tab.Screen name="Assign Room" component={AssignRoom} />
      <Tab.Screen name="Contacts" component={() => <CRUDScreen title="Contacts" placeholder="Contact Info" dataKey="contact" />} />
      <Tab.Screen name="Notifications" component={Notifications} />
      <Tab.Screen name="Analytics" component={Analytics} />
      <Tab.Screen name="Rooms" component={() => <CRUDScreen title="Rooms" placeholder="Room Info" dataKey="room" />} />
      <Tab.Screen name="Bookings" component={() => <CRUDScreen title="Bookings" placeholder="Booking Info" dataKey="booking" />} />
      <Tab.Screen name="Payments" component={() => <CRUDScreen title="Payments" placeholder="Payment Info" dataKey="payment" />} />
      <Tab.Screen name="Expenses" component={() => <CRUDScreen title="Expenses" placeholder="Expense Info" dataKey="expense" />} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthenticationScreen} />
      <Stack.Screen name="Caretaker" component={CaretakerTabs} />
      <Stack.Screen name="Owner" component={OwnerTabs} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  card: {
    padding: 15,
    marginVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});
