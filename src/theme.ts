/**
 * NSCENE design tokens. Legacy color keys remain as compatibility aliases for
 * existing screens while new work uses the semantic NSCENE keys.
 */
export const theme = {
  colors: {
    base: '#030706',
    elevated: '#101613',
    card: '#151B23',
    textPrimary: '#F8FAFC',
    signalBlue: '#FFDA77',
    liveRed: '#FF4D5A',
    success: '#42D392',

    // Compatibility aliases used by the existing app shell.
    voidBlack: '#030706',
    deepGray: '#101613',
    darkGray: '#151B23',
    mediumGray: '#202733',
    lightGray: '#313A49',
    borderGray: '#3B4657',
    textSecondary: '#B8C0CC',
    textTertiary: '#7F8A99',
    warning: '#F0A45D',
    error: '#FF4D5A',
    info: '#FFDA77',
    glassBackground: 'rgba(13, 17, 23, 0.78)',
    glassBorder: 'rgba(248, 250, 252, 0.10)',
    glassHighlight: 'rgba(248, 250, 252, 0.05)',
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
    fontFamily: {
      regular: 'System',
      tabular: 'System',
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

  glassmorphism: {
    blur: 10,
    opacity: 0.7,
    borderOpacity: 0.1,
  },

  layout: {
    feedItemSpacing: 24,
    contentPadding: 16,
    maxContentWidth: 600,
  },
} as const;

export type Theme = typeof theme;
