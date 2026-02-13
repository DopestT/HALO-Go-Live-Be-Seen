import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { THEME, COLORS } from '../constants';

interface HaloButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * HaloButton - Standard button component with glassmorphism
 * Uses calm, rounded geometry and soft colors
 */
export const HaloButton: React.FC<HaloButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}) => {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outline' && styles.outline,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    variant === 'outline' && styles.outlineText,
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: THEME.radius.large,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.calmBlue,
  },
  secondary: {
    backgroundColor: COLORS.overlay.medium,
    borderWidth: 1,
    borderColor: COLORS.overlay.medium,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.whisper,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: THEME.fontSize.md,
    fontFamily: THEME.fonts.bold,
    color: COLORS.softWhite,
  },
  outlineText: {
    color: COLORS.whisper,
  },
  disabledText: {
    color: COLORS.slate,
  },
});
