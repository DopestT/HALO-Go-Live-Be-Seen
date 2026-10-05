import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { PALETTE, LAYOUT } from '../../constants/theme';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>{children}</View>
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
  content: {
    width: '100%',
    height: '100%',
  },
});
