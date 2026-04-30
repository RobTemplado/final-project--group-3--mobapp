import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import AdminPanelScreen from "../screens/AdminPanelScreen";
import MyProfileScreen from "../screens/MyProfileScreen";
import { useAppContext } from "../context/AppContext";
import { colors, radii } from "../utils/theme";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<
  string,
  { focused: IoniconsName; default: IoniconsName }
> = {
  Dashboard: { focused: "grid", default: "grid-outline" },
  "Add Expense": { focused: "add-circle", default: "add-circle-outline" },
  Admin: { focused: "shield", default: "shield-outline" },
  "My Profile": { focused: "person-circle", default: "person-circle-outline" },
};

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AppTabs() {
  const { currentUser } = useAppContext();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: "absolute",
          bottom: 24,
          left: 20,
          right: 20,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          height: 64,
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginBottom: 4,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = icons
            ? focused
              ? icons.focused
              : icons.default
            : "ellipse-outline";
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Add Expense" component={AddExpenseScreen} />
      {currentUser?.role === "Admin" ? (
        <Tabs.Screen
          name="Admin"
          component={AdminPanelScreen}
          options={{ headerRight: () => null }}
        />
      ) : null}
      <Tabs.Screen name="My Profile" component={MyProfileScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { currentUser, isLoading } = useAppContext();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      {currentUser ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
