import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

export type AsyncStateKind = 'loading' | 'empty' | 'unavailable' | 'error' | 'not-found';

const stateCopy: Record<AsyncStateKind, { title: string; message: string }> = {
  loading: {
    title: 'LOADING',
    message: 'Checking NSCENE for verified content.',
  },
  empty: {
    title: 'NOTHING HERE YET',
    message: 'No verified content is available in this lane yet.',
  },
  unavailable: {
    title: 'UNAVAILABLE',
    message: 'NSCENE data is not available from this deployment right now.',
  },
  error: {
    title: 'COULD NOT LOAD',
    message: 'NSCENE could not load this content.',
  },
  'not-found': {
    title: 'NOT FOUND',
    message: 'The requested NSCENE record was not found.',
  },
};

export const AsyncState = ({
  state,
  message,
  compact = false,
}: {
  state: AsyncStateKind;
  message?: string;
  compact?: boolean;
}) => {
  const copy = stateCopy[state];
  return (
    <View accessibilityLiveRegion="polite" style={[styles.wrap, compact && { minHeight: 80, padding: 12, marginBottom: 12 }]}>
      {state === 'loading' ? <ActivityIndicator accessibilityLabel="Loading NSCENE content" /> : null}
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.message}>{message ?? copy.message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.base,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.3,
    textAlign: 'center',
  },
  message: {
    maxWidth: 520,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
