import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import OwnerTabs from "./screens/OwnerTabs"

const Stack = createStackNavigator();

export default function App() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Owner" component={OwnerTabs} />
    </Stack.Navigator>
  );
}

