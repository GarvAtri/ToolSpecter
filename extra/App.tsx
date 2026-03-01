// App.tsx — Root entry point
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SplashScreen     from './src/screens/SplashScreen';
import LoginScreen      from './src/screens/LoginScreen';
import FleetScreen      from './src/screens/FleetScreen';
import SetupScreen      from './src/screens/InspectionSetupScreen';
import LiveCamScreen    from './src/screens/LiveCameraScreen';
import ReportScreen     from './src/screens/ReportScreen';
import AddVehicleScreen from './src/screens/AddVehicleScreen';

export type RootStackParamList = {
  Splash:     undefined;
  Login:      undefined;
  Fleet:      undefined;
  Setup:      { vehicle: Vehicle };
  LiveCamera: { vehicle: Vehicle; checklistItems: ChecklistItem[] };
  Report:     { vehicle: Vehicle; sessionId: string };
  AddVehicle: undefined;
};

export type Vehicle = {
  id: string;
  name: string;
  model: string;
  year: number;
  hours: string;
  status: 'good' | 'monitor' | 'severe';
  glbUrl?: string;
  serialNumber?: string;
};

export type ChecklistItem = {
  id: string;
  section: string;
  label: string;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#080808" />
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Splash"     component={SplashScreen} />
          <Stack.Screen name="Login"      component={LoginScreen} />
          <Stack.Screen name="Fleet"      component={FleetScreen} />
          <Stack.Screen name="Setup"      component={SetupScreen} />
          <Stack.Screen name="LiveCamera" component={LiveCamScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Report"     component={ReportScreen} />
          <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
