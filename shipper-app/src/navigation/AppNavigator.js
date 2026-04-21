import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import AvailableOrdersScreen from "../screens/AvailableOrdersScreen";
import ActiveDeliveriesScreen from "../screens/ActiveDeliveriesScreen";
import ScannerScreen from "../screens/ScannerScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#FF6B35",
        tabBarInactiveTintColor: "#888",
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="AvailableOrders"
        component={AvailableOrdersScreen}
        options={{
          tabBarLabel: "Chờ nhận",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ActiveDeliveries"
        component={ActiveDeliveriesScreen}
        options={{
          tabBarLabel: "Đang giao",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🚚</Text>
          ),
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
            options={{ presentation: "fullScreenModal" }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
