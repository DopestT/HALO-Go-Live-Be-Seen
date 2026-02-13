import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassPanel, HaloButton } from '../components';
import { THEME, COLORS } from '../constants';

interface OnboardingScreenProps {
  navigation: any;
}

/**
 * Onboarding Screen - First-time user experience
 * Calm introduction to HALO's presence-over-performance philosophy
 */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const handleGetStarted = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <GlassPanel style={styles.panel}>
        <Text style={styles.title}>Welcome to HALO</Text>
        <Text style={styles.subtitle}>Presence over Performance</Text>
        <Text style={styles.description}>
          A calm, guardian-like space for intentional live streaming.
          Connect with others authentically, without the chaos.
        </Text>
        
        <View style={styles.buttonContainer}>
          <HaloButton
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
          />
        </View>
      </GlassPanel>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.voidBlack,
    justifyContent: 'center',
    padding: THEME.spacing.lg,
  },
  panel: {
    alignItems: 'center',
  },
  title: {
    fontSize: THEME.fontSize.xxxl,
    fontFamily: THEME.fonts.bold,
    color: COLORS.softWhite,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: THEME.fontSize.lg,
    fontFamily: THEME.fonts.regular,
    color: COLORS.haloGlow,
    marginBottom: THEME.spacing.lg,
  },
  description: {
    fontSize: THEME.fontSize.md,
    fontFamily: THEME.fonts.regular,
    color: COLORS.whisper,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    marginTop: THEME.spacing.md,
  },
});
