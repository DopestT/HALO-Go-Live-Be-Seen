import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { PALETTE, LAYOUT } from '../constants/theme';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import GoLiveFlow from '../screens/stream/GoLiveFlow';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute', borderTopWidth: 0, elevation: 0 },
        tabBarBackground: () => (
          <BlurView intensity={30} tint="dark" style={{ flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.8)' }} />
        ),
        tabBarActiveTintColor: PALETTE.haloCyan,
        tabBarInactiveTintColor: 'rgba(234, 246, 255, 0.4)',
      }}
    >
      <Tab.Screen name="Discovery" component={HomeScreen} />
      <Tab.Screen 
        name="Live" 
        component={GoLiveFlow} 
        options={{ 
          tabBarLabel: 'Go Live',
          // Custom icon would go here
        }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
