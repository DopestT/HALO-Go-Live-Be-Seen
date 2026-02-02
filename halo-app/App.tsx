import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, StreamProvider } from './src/contexts';
import { RootStack } from './src/navigation';

/**
 * HALO App - Go Live, Be Seen
 * Entry point with context providers and navigation
 */
export default function App() {
  return (
    <AuthProvider>
      <StreamProvider>
        <StatusBar style="light" />
        <RootStack />
      </StreamProvider>
    </AuthProvider>
  );
}
