import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { DiscoveryFeed } from './src/screens/DiscoveryFeed';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <StatusBar style="light" />
      {isAuthenticated ? <DiscoveryFeed /> : <LoginScreen />}
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
