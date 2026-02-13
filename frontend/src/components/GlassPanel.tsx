import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { THEME, COLORS } from '../constants';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'light' | 'medium' | 'dark';
}

/**
 * GlassPanel - Core glassmorphism component for HALO
 * Always uses rounded geometry (radius: 24)
 */
export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  style,
  variant = 'medium',
}) => {
  const variantStyles = {
    light: styles.light,
    medium: styles.medium,
    dark: styles.dark,
  };

  return (
    <View style={[styles.container, variantStyles[variant], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: THEME.radius.large,
    padding: THEME.spacing.md,
    borderWidth: 1,
  },
  light: {
    backgroundColor: COLORS.overlay.light,
    borderColor: COLORS.overlay.medium,
  },
  medium: {
    backgroundColor: COLORS.overlay.medium,
    borderColor: COLORS.overlay.medium,
  },
  dark: {
    backgroundColor: COLORS.overlay.dark,
    borderColor: COLORS.overlay.medium,
  },
});
