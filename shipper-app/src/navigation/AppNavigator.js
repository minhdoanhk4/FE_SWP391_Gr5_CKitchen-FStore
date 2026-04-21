import { View, Text, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import AvailableOrdersScreen from "../screens/AvailableOrdersScreen";
import ActiveDeliveriesScreen from "../screens/ActiveDeliveriesScreen";
import ScannerScreen from "../screens/ScannerScreen";
import T from "../theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <View style={[tabIconStyles.wrap, focused && tabIconStyles.wrapActive]}>
      <Text style={tabIconStyles.emoji}>{emoji}</Text>
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrap: {
    width: 42,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  wrapActive: { backgroundColor: T.colors.primaryBg },
  emoji: { fontSize: 20 },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.colors.primary,
        tabBarInactiveTintColor: T.colors.textMuted,
        tabBarStyle: {
          backgroundColor: T.colors.surface,
          borderTopColor: T.colors.surfaceBorder,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 6,
          elevation: 8,
          shadowColor: T.colors.textDark,
          shadowOpacity: 0.10,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen
        name="AvailableOrders"
        component={AvailableOrdersScreen}
        options={{
          tabBarLabel: "Chờ nhận",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ActiveDeliveries"
        component={ActiveDeliveriesScreen}
        options={{
          tabBarLabel: "Đang giao",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚚" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
