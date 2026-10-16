import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { DiscoveryFeed } from './src/screens/DiscoveryFeed';
import { AccountScreen } from './src/screens/AccountScreen';
import { PublicLaneScreen } from './src/screens/PublicLaneScreen';
import GoLiveFlow from './src/screens/stream/GoLiveFlow';
import {
  accountActionsFor,
  AppSection,
  initialAppSection,
  primaryNavigation,
  resolveRequestedSection,
} from './src/appShell';
import { productIdentity, PublicSection } from './src/product';
import { theme } from './src/theme';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 980;
  const [section, setSection] = useState<AppSection>(initialAppSection);
  const [isLive, setIsLive] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const visibleSection = resolveRequestedSection(section, isAuthenticated);

  const openSection = (next: AppSection) => {
    setIsLive(false);
    setAccountMenuOpen(false);
    setSection(next);
  };

  const publicContent = (publicSection: PublicSection) => (
    publicSection === 'live'
      ? <DiscoveryFeed />
      : <PublicLaneScreen section={publicSection} />
  );

  const content = visibleSection === 'studio'
    ? <GoLiveFlow onLiveStateChange={setIsLive} />
    : visibleSection === 'account'
      ? <AccountScreen />
      : visibleSection === 'signin'
        ? <LoginScreen />
        : publicContent(visibleSection);

  const avatarLabel = user?.username?.trim()?.slice(0, 1)?.toUpperCase() || 'N';
  const accountActions = accountActionsFor(isAuthenticated);

  const accountControl = isAuthenticated ? (
    <TouchableOpacity
      accessibilityLabel="Open account menu"
      style={styles.avatarButton}
      onPress={() => setAccountMenuOpen((open) => !open)}
    >
      <Text style={styles.avatarText}>{avatarLabel}</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity style={styles.signInButton} onPress={() => openSection('signin')}>
      <Text style={styles.signInText}>SIGN IN</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.app}>
      <StatusBar style="light" hidden={isLive} />

      {!isLive && (
        <View style={[styles.nav, isCompact && styles.navCompact]}>
          <View style={styles.brandRow}>
            <TouchableOpacity style={styles.brandButton} onPress={() => openSection('live')}>
              <Text style={styles.brand}>{productIdentity.name}</Text>
            </TouchableOpacity>
            {isCompact ? accountControl : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.publicNavScroll, isCompact && styles.publicNavScrollCompact]}
            contentContainerStyle={styles.publicNavScrollContent}
          >
            <View style={styles.publicNav}>
              {primaryNavigation.map((item) => (
                <NavButton
                  key={item.id}
                  label={item.label}
                  active={visibleSection === item.id}
                  onPress={() => openSection(item.id)}
                />
              ))}
            </View>
          </ScrollView>

          {!isCompact ? accountControl : null}

          {isAuthenticated && accountMenuOpen && (
            <View style={[styles.accountMenu, isCompact && styles.accountMenuCompact]}>
              <Text style={styles.accountMenuEyebrow}>YOUR NSCENE</Text>
              {accountActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.accountMenuItem}
                  onPress={() => openSection(action.id)}
                >
                  <Text style={styles.accountMenuItemText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      <View
        style={[
          styles.content,
          !isLive && (isCompact ? styles.contentWithCompactNav : styles.contentWithNav),
        ]}
      >
        {content}
      </View>
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
    height: 68,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: 'rgba(0,0,0,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderGray,
    zIndex: 100,
  },
  navCompact: {
    height: 116,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  brand: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  publicNavScroll: {
    flex: 1,
  },
  publicNavScrollCompact: {
    width: '100%',
    flexGrow: 0,
  },
  publicNavScrollContent: {
    alignItems: 'center',
  },
  publicNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navButton: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  navButtonActive: {
    backgroundColor: theme.colors.deepGray,
  },
  navButtonText: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  navButtonTextActive: {
    color: theme.colors.textPrimary,
  },
  signInButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
    borderRadius: 999,
  },
  signInText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.textPrimary,
  },
  avatarText: {
    color: theme.colors.voidBlack,
    fontSize: 14,
    fontWeight: '800',
  },
  accountMenu: {
    position: 'absolute',
    top: 58,
    right: 24,
    width: 220,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
    backgroundColor: theme.colors.deepGray,
    zIndex: 200,
    ...theme.shadows.medium,
  },
  accountMenuCompact: {
    top: 54,
    right: 16,
  },
  accountMenuEyebrow: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  accountMenuItem: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  accountMenuItemText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  contentWithNav: {
    paddingTop: 68,
  },
  contentWithCompactNav: {
    paddingTop: 116,
  },
});
