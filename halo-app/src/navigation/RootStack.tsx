import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingScreen, HomeScreen, LiveRoomScreen } from '../screens';
import { COLORS } from '../constants';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  LiveRoom: { streamId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

/**
 * RootStack - Main navigation stack
 */
export const RootStack: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.voidBlack },
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="LiveRoom" component={LiveRoomScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootStack;
