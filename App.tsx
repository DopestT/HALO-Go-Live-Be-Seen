import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';

import { PALETTE, TYPOGRAPHY } from './src/constants/theme';
import { GlassPanel } from './src/components/ui/GlassPanel';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar barStyle="light-content" />
      
      {/* Subtle Glow Background */}
      <LinearGradient
        colors={[PALETTE.voidBlack, '#0f172a']} // Slight gradient for depth
        style={StyleSheet.absoluteFillObject}
      />

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        <Text style={styles.brandTitle}>HALO</Text>
        <Text style={styles.tagline}>Go Live, Be Seen.</Text>

        {/* The Glass Interface */}
        <GlassPanel style={styles.panel}>
          <Text style={styles.panelHeader}>System Ready</Text>
          <Text style={styles.panelText}>
            Guardian protocols active.{"\n"}
            Adult Mode: <Text style={{color: PALETTE.warning}}>GATED</Text>
          </Text>
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.voidBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 48,
    color: PALETTE.haloWhite,
    letterSpacing: 4, // +2% tracking visual approximation
    marginBottom: 8,
    textShadowColor: PALETTE.haloCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20, // Soft glow accent
  },
  tagline: {
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 16,
    color: PALETTE.haloBlue,
    opacity: 0.8,
    marginBottom: 48,
  },
  panel: {
    width: '100%',
    height: 150,
  },
  panelHeader: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 18,
    color: PALETTE.haloWhite,
    marginBottom: 8,
  },
  panelText: {
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 14,
    color: PALETTE.haloWhite,
    opacity: 0.7,
    lineHeight: 22,
  },
});
