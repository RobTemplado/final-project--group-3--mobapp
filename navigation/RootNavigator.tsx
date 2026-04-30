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
import { colors, fonts, radii } from "../utils/theme";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, { focused: IoniconsName; default: IoniconsName }> = {
  Dashboard: { focused: "grid", default: "grid-outline" },
  "Add Expense": { focused: "add-circle", default: "add-circle-outline" },
  Admin: { focused: "shield", default: "shield-outline" },
  "My Profile": { focused: "person-circle", default: "person-circle-outline" },
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="Login" component={LoginScreen} />
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
          bottom: 20,
          left: 16,
          right: 16,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          height: 68,
          borderTopWidth: 0,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          fontFamily: fonts.body,
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = icons
            ? focused ? icons.focused : icons.default
            : "ellipse-outline";
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen
        name="Add Expense"
        component={AddExpenseScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="add-circle"
              size={32}
              color={focused ? colors.accent : colors.primary}
            />
          ),
        }}
      />
      {currentUser?.role === "Admin" ? (
        <Tabs.Screen name="Admin" component={AdminPanelScreen} />
      ) : null}
      <Tabs.Screen name="My Profile" component={MyProfileScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { currentUser, isLoading } = useAppContext();

  if (isLoading) return null;

  return (
    <NavigationContainer>
      {currentUser ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}