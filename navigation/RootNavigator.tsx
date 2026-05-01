import React, { useEffect, useRef } from "react";
import { Alert, Animated } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

function AnimatedIcon({ focused, name, color, size }: { focused: boolean; name: IoniconsName; color: string; size: number }) {
  const scale = useRef(new Animated.Value(focused ? 1.2 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 4,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  const { currentUser, populateRandomData } = useAppContext();
  const insets = useSafeAreaInsets();
  const floatingBottom = Math.max(insets.bottom, 16);

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          position: "absolute",
          bottom: floatingBottom,
          left: 32,
          right: 32,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          height: 68,
          borderTopWidth: 0,
          marginHorizontal: 16,
          paddingBottom: 0,
          paddingTop: 0,
          display: (route.params as any)?.isCameraOpen ? "none" : "flex",
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          fontFamily: fonts.body,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = icons
            ? focused ? icons.focused : icons.default
            : "ellipse-outline";
          return <AnimatedIcon focused={focused} name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        listeners={{
          tabLongPress: async () => {
            await populateRandomData();
            Alert.alert("Debug Mode", "Random data has been populated!");
          }
        }}
      />
      <Tabs.Screen
        name="Add Expense"
        component={AddExpenseScreen}
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