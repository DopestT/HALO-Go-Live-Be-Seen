import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../theme';
import { LiveStreamOverlay } from '../components/LiveStreamOverlay';

export const LiveStreamDemo: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <View style={styles.container}>
      {showOverlay ? (
        <LiveStreamOverlay
          streamId="demo-stream-1"
          streamTitle="Creative Coding Session"
          username="developer_one"
          viewerCount={127}
          onClose={() => setShowOverlay(false)}
        />
      ) : (
        <View style={styles.demoContainer}>
          <Text style={styles.title}>Live Stream Demo</Text>
          <Text style={styles.description}>
            Tap the button below to see the LiveStreamOverlay with one-tap reporting
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowOverlay(true)}
          >
            <Text style={styles.buttonText}>View Live Stream</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.voidBlack,
  },
  demoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontVariant: ['tabular-nums'],
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
    fontVariant: ['tabular-nums'],
  },
  button: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.small,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
