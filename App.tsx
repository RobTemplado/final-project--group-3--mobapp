import { StatusBar } from "expo-status-bar";
import React from "react";
import * as Notifications from "expo-notifications";
import { AppContextProvider } from "./context/AppContext";
import RootNavigator from "./navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContextProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AppContextProvider>
    </SafeAreaProvider>
  );
}
