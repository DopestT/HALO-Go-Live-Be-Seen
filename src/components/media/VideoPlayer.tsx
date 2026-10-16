import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';

export const VideoPlayer = ({
  streamUrl,
  title,
}: {
  streamUrl: string;
  title: string;
}) => {
  if (!streamUrl) return null;

  if (Platform.OS === 'web') {
    return React.createElement('video' as never, {
      src: streamUrl,
      controls: true,
      playsInline: true,
      preload: 'metadata',
      'aria-label': `Video player for ${title}`,
      style: {
        width: '100%',
        aspectRatio: '16 / 9',
        display: 'block',
        backgroundColor: '#000000',
      },
    });
  }

  return (
    <View style={styles.nativeFallback}>
      <Text style={styles.nativeTitle}>NSCENE VIDEO</Text>
      <Text style={styles.nativeCopy}>
        This stream is ready. Open it with the device media handler.
      </Text>
      <TouchableOpacity
        accessibilityLabel={`Open video for ${title}`}
        style={styles.openButton}
        onPress={() => {
          void Linking.openURL(streamUrl);
        }}
      >
        <Text style={styles.openButtonText}>OPEN VIDEO</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeFallback: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#000000',
    borderRadius: theme.borderRadius.large,
  },
  nativeTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  nativeCopy: {
    maxWidth: 420,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  openButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: theme.colors.signalBlue,
  },
  openButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});
