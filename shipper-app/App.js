import { useRef, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { setNavigationRef } from "./src/api/axiosConfig";

export default function App() {
  const navRef = useRef(null);

  useEffect(() => {
    setNavigationRef(navRef.current);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navRef}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
