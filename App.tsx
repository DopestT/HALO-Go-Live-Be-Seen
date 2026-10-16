import React, { useEffect, useState } from 'react';
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
import { UploadsScreen } from './src/screens/UploadsScreen';
import { WatchScreen } from './src/screens/WatchScreen';
import { CreatorsScreen } from './src/screens/CreatorsScreen';
import { CreatorProfileScreen } from './src/screens/CreatorProfileScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { PublicLaneScreen } from './src/screens/PublicLaneScreen';
import GoLiveFlow from './src/screens/stream/GoLiveFlow';
import {
  accountActionsFor,
  AppSection,
  primaryNavigation,
  resolveRequestedSection,
} from './src/appShell';
import { PublicAppRoute, usePublicNavigation } from './src/navigation/PublicNavigator';
import { isPublicSection, productIdentity, PublicSection } from './src/product';
import { theme } from './src/theme';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 980;
  const { route, navigate } = usePublicNavigation();
  const [isLive, setIsLive] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const requestedSection: AppSection | null = route.kind === 'section'
    ? route.section
    : route.kind === 'protected'
      ? route.section
      : null;
  const visibleSection = requestedSection
    ? resolveRequestedSection(requestedSection, isAuthenticated)
    : null;

  useEffect(() => {
    if (route.kind !== 'protected') return;
    const resolved = resolveRequestedSection(route.section, isAuthenticated);
    if (resolved === route.section) return;

    navigate(
      isPublicSection(resolved)
        ? { kind: 'section', section: resolved }
        : { kind: 'protected', section: resolved },
    );
  }, [isAuthenticated, navigate, route]);

  const openRoute = (next: Exclude<PublicAppRoute, { kind: 'not-found' }>) => {
    setIsLive(false);
    setAccountMenuOpen(false);
    navigate(next);
  };

  const openSection = (next: AppSection) => {
    openRoute(
      isPublicSection(next)
        ? { kind: 'section', section: next }
        : { kind: 'protected', section: next },
    );
  };

  const openVideo = (videoId: number) => openRoute({ kind: 'watch', id: videoId });
  const openCreator = (creatorId: number) => openRoute({ kind: 'creator', id: creatorId });

  const publicContent = (publicSection: PublicSection) => {
    if (publicSection === 'live') return <DiscoveryFeed onOpen={openVideo} />;
    if (publicSection === 'uploads') return <UploadsScreen onOpen={openVideo} />;
    if (publicSection === 'creators') return <CreatorsScreen onOpen={openCreator} />;
    return <PublicLaneScreen section={publicSection} />;
  };

  let content: React.ReactNode;
  if (route.kind === 'watch') {
    content = <WatchScreen id={route.id} />;
  } else if (route.kind === 'creator') {
    content = <CreatorProfileScreen id={route.id} onOpenVideo={openVideo} />;
  } else if (route.kind === 'not-found') {
    content = (
      <RoutePendingScreen
        title="NOT FOUND"
        message="This NSCENE route does not exist."
      />
    );
  } else {
    content = visibleSection === 'studio'
      ? <GoLiveFlow onLiveStateChange={setIsLive} />
      : visibleSection === 'account'
        ? <AccountScreen />
        : visibleSection === 'signin'
          ? <LoginScreen />
          : visibleSection
            ? publicContent(visibleSection)
            : null;
  }

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
    <TouchableOpacity
      accessibilityLabel="Sign in to NSCENE"
      style={styles.signInButton}
      onPress={() => openSection('signin')}
    >
      <Text style={styles.signInText}>SIGN IN</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.app}>
      <StatusBar style="light" hidden={isLive} />

      {!isLive && (
        <View style={[styles.nav, isCompact && styles.navCompact]}>
          <View style={styles.brandRow}>
            <TouchableOpacity
              accessibilityLabel="Open NSCENE Live"
              style={styles.brandButton}
              onPress={() => openSection('live')}
            >
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
                  active={route.kind === 'section' && route.section === item.id}
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
                  accessibilityLabel={`Open ${action.label.toLowerCase()}`}
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
  <TouchableOpacity
    accessibilityLabel={`Open ${label.toLowerCase()}`}
    style={[styles.navButton, active && styles.navButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.navButtonText, active && styles.navButtonTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const RoutePendingScreen = ({ title, message }: { title: string; message: string }) => (
  <View style={styles.routeState}>
    <Text style={styles.routeStateEyebrow}>{productIdentity.name}</Text>
    <Text style={styles.routeStateTitle}>{title}</Text>
    <Text style={styles.routeStateMessage}>{message}</Text>
  </View>
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
    backgroundColor: theme.colors.base,
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
    backgroundColor: 'rgba(7,10,15,0.96)',
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
    backgroundColor: theme.colors.elevated,
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
    color: theme.colors.base,
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
    backgroundColor: theme.colors.elevated,
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
  routeState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: theme.colors.base,
  },
  routeStateEyebrow: {
    color: theme.colors.signalBlue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  routeStateTitle: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  routeStateMessage: {
    maxWidth: 520,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
