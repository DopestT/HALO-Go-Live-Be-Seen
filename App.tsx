import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { DiscoveryFeed } from './src/screens/DiscoveryFeed';
import { AccountScreen } from './src/screens/AccountScreen';
import GoLiveFlow from './src/screens/stream/GoLiveFlow';
import { theme } from './src/theme';

type AppSection = 'discover' | 'studio' | 'account';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [section, setSection] = useState<AppSection>('discover');
  const [isLive, setIsLive] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen />
      </>
    );
  }

  const openSection = (next: AppSection) => {
    setIsLive(false);
    setSection(next);
  };

  const content = section === 'studio'
    ? <GoLiveFlow onLiveStateChange={setIsLive} />
    : section === 'account'
      ? <AccountScreen />
      : <DiscoveryFeed />;

  return (
    <View style={styles.app}>
      <StatusBar style="light" hidden={isLive} />

      {!isLive && (
        <View style={styles.nav}>
          <TouchableOpacity style={styles.brandButton} onPress={() => openSection('discover')}>
            <Text style={styles.brand}>Tube</Text>
          </TouchableOpacity>

          <View style={styles.navActions}>
            <NavButton label="Discover" active={section === 'discover'} onPress={() => openSection('discover')} />
            <NavButton label="Go Live" active={section === 'studio'} onPress={() => openSection('studio')} />
            <NavButton label="Account" active={section === 'account'} onPress={() => openSection('account')} />
          </View>
        </View>
      )}

      <View style={[styles.content, !isLive && styles.contentWithNav]}>{content}</View>
    </View>
  );
};

const NavButton = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity style={[styles.navButton, active && styles.navButtonActive]} onPress={onPress}>
    <Text style={[styles.navButtonText, active && styles.navButtonTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.voidBlack,
  },
  nav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.94)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderGray,
    zIndex: 100,
  },
  brandButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  brand: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  navButtonActive: {
    backgroundColor: theme.colors.deepGray,
  },
  navButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  navButtonTextActive: {
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  contentWithNav: {
    paddingTop: 64,
  },
});
