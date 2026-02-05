import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { PALETTE, LAYOUT } from '../../constants/theme';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  style, 
  intensity = 20 
}) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.blur}>
        <View style={styles.content}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: LAYOUT.radius,
    overflow: 'hidden',
    backgroundColor: PALETTE.glass,
    borderColor: PALETTE.glassBorder,
    borderWidth: 1,
  },
  blur: {
    padding: LAYOUT.spacing,
    width: '100%',
    height: '100%',
  },
  content: {
    // Ensure content sits clearly on top of the blur
    zIndex: 1, 
  }
});
