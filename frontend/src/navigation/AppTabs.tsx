import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens';
import { COLORS, THEME } from '../constants';

export type AppTabsParamList = {
  Feed: undefined;
  Explore: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

/**
 * AppTabs - Bottom tab navigation (for authenticated users)
 */
export const AppTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.deepSpace,
          borderTopColor: COLORS.overlay.medium,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: COLORS.haloGlow,
        tabBarInactiveTintColor: COLORS.slate,
        tabBarLabelStyle: {
          fontFamily: THEME.fonts.regular,
          fontSize: THEME.fontSize.xs,
        },
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Live',
        }}
      />
      <Tab.Screen 
        name="Explore" 
        component={HomeScreen} // Placeholder
        options={{
          tabBarLabel: 'Explore',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={HomeScreen} // Placeholder
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};
