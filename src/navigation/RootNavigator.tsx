import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { PALETTE } from '../constants/theme';

// Auth Screens
import AgeGateScreen from '../screens/auth/AgeGateScreen';
// import LoginScreen from '../screens/auth/LoginScreen'; // (Next step)

// App Screens
// import MainTabNavigator from './MainTabNavigator'; // (Next step)

// Temporary Placeholder for App
import { View, Text } from 'react-native';
const PlaceholderApp = () => (
  <View style={{flex:1, backgroundColor: PALETTE.voidBlack, justifyContent:'center', alignItems:'center'}}>
    <Text style={{color: 'white'}}>Home Stream</Text>
  </View>
);

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Protected Routes
          <Stack.Screen name="Main" component={PlaceholderApp} />
        ) : (
          // Public Routes
          <>
            <Stack.Screen name="AgeGate" component={AgeGateScreen} />
            {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
