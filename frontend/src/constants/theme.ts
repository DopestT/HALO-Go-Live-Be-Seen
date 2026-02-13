/**
 * HALO Theme Constants
 * Locked design system for consistent glassmorphism aesthetic
 */

export const THEME = {
  // Border Radius - Only rounded geometry
  radius: {
    small: 12,
    medium: 16,
    large: 24,
    xl: 32,
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Typography
  fonts: {
    regular: 'Inter-Regular',
    bold: 'Inter-Bold',
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },

  // Glassmorphism
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
    blur: 20,
  },

  // Glow Effects
  glow: {
    soft: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    medium: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
  },
} as const;

export default THEME;
