import { StatusBar } from "expo-status-bar";
import React from "react";
import * as Notifications from "expo-notifications";
import { AppContextProvider } from "./context/AppContext";
import RootNavigator from "./navigation/RootNavigator";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <AppContextProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppContextProvider>
  );
}
