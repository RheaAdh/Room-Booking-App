import { createDrawerNavigator } from "@react-navigation/drawer"; 
import React from "react";
import DashboardScreen from "./DashboardScreen";
import ContactScreen from "./ContactScreen";
import BookingsScreen from "./BookingScreen";
import ExpenseScreen from "./ExpenseScreen";
import RoomScreen from "./RoomScreen";
import BookingGrid from "./BookingGrid";
import RoomCostTable from "./RoomCostTable";

export default function OwnerTabs() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Contacts" component={ContactScreen} />
      <Drawer.Screen name="Bookings" component={BookingsScreen} />
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Booking Grid" component={BookingGrid} />
      <Drawer.Screen name="Rooms" component={RoomScreen} />
      <Drawer.Screen name="Expenses" component={ExpenseScreen} />
      <Drawer.Screen name="Room Cost" component={RoomCostTable} />
    </Drawer.Navigator>
  );
}

const Drawer = createDrawerNavigator();
