import { createDrawerNavigator } from "@react-navigation/drawer"; 
import React from "react";
import OwnerDashboard from "./OwnerDashboard";
import ContactScreen from "./ContactScreen";
import BookingsScreen from "./BookingScreen";
import PaymentScreen from "./PaymentScreen";
import ExpenseScreen from "./ExpenseScreen";
import RoomScreen from "./RoomScreen";

export default function OwnerTabs() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Dashboard" component={OwnerDashboard} />
      <Drawer.Screen name="Contacts" component={ContactScreen} />
      <Drawer.Screen name="Rooms" component={RoomScreen} />
      <Drawer.Screen name="Bookings" component={BookingsScreen} />
      <Drawer.Screen name="Transaction History" component={PaymentScreen} />
      <Drawer.Screen name="Expenses" component={ExpenseScreen} />
    </Drawer.Navigator>
  );
}

const Drawer = createDrawerNavigator();
