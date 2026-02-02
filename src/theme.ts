/**
 * HALO Design System
 * Void Black aesthetic with rounded geometry and tabular numbers
 */

export const theme = {
  colors: {
    // Void Black palette - no neon colors
    voidBlack: '#000000',
    deepGray: '#121212',
    darkGray: '#1a1a1a',
    mediumGray: '#2a2a2a',
    lightGray: '#3a3a3a',
    borderGray: '#404040',
    
    // Neutral tones
    textPrimary: '#ffffff',
    textSecondary: '#b0b0b0',
    textTertiary: '#808080',
    
    // Functional colors - muted, no urgency
    success: '#4a7c59',
    warning: '#7c6d4a',
    error: '#7c4a4a',
    info: '#4a5c7c',
    
    // Glassmorphism
    glassBackground: 'rgba(18, 18, 18, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassHighlight: 'rgba(255, 255, 255, 0.05)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    extraLarge: 20,
    round: 9999,
  },
  
  typography: {
    // Tabular numbers for consistency
    fontFamily: {
      regular: 'System',
      tabular: 'System', // Using system font with tabular-nums variant
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 10.32,
      elevation: 8,
    },
  },
  
  // Glassmorphism effect settings
  glassmorphism: {
    blur: 10,
    opacity: 0.7,
    borderOpacity: 0.1,
  },
  
  // Low-density layout spacing
  layout: {
    feedItemSpacing: 24,
    contentPadding: 16,
    maxContentWidth: 600,
  },
} as const;

export type Theme = typeof theme;
