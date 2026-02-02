import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassPanel, HaloButton } from '../components';
import { THEME, COLORS } from '../constants';
import { useStream } from '../contexts';

interface LiveRoomScreenProps {
  navigation: any;
  route: {
    params: {
      streamId: string;
    };
  };
}

/**
 * LiveRoom Screen - Active live stream viewing/hosting
 * Includes Report and Block utilities for safety
 */
export const LiveRoomScreen: React.FC<LiveRoomScreenProps> = ({ navigation, route }) => {
  const { streamId } = route.params;
  const { activeStream, leaveStream, reportStream, blockUser } = useStream();

  const handleLeave = () => {
    leaveStream();
    navigation.goBack();
  };

  const handleReport = () => {
    // SAFETY: Report utility
    const reason = 'User reported stream'; // In real app, show modal to collect reason
    reportStream(streamId, reason);
  };

  const handleBlock = () => {
    // SAFETY: Block utility
    const hostId = 'host-id'; // Get from activeStream
    blockUser(hostId);
  };

  return (
    <View style={styles.container}>
      {/* Video/Stream view would go here */}
      <View style={styles.videoContainer}>
        <Text style={styles.videoPlaceholder}>Stream Video</Text>
      </View>

      {/* Stream Info */}
      <GlassPanel style={styles.infoPanel}>
        <Text style={styles.hostName}>Host Name</Text>
        <Text style={styles.streamTitle}>Stream Title</Text>
        <Text style={styles.viewerCount}>42 viewers</Text>
      </GlassPanel>

      {/* Safety Controls */}
      <View style={styles.controls}>
        <GlassPanel style={styles.safetyPanel}>
          <Text style={styles.safetyTitle}>Safety</Text>
          <TouchableOpacity style={styles.safetyButton} onPress={handleReport}>
            <Text style={styles.safetyButtonText}>Report Stream</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.safetyButton} onPress={handleBlock}>
            <Text style={styles.safetyButtonText}>Block User</Text>
          </TouchableOpacity>
        </GlassPanel>
      </View>

      {/* Leave Button */}
      <View style={styles.footer}>
        <HaloButton
          title="Leave Stream"
          onPress={handleLeave}
          variant="outline"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.voidBlack,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: COLORS.deepSpace,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    fontSize: THEME.fontSize.xl,
    fontFamily: THEME.fonts.regular,
    color: COLORS.whisper,
  },
  infoPanel: {
    margin: THEME.spacing.lg,
  },
  hostName: {
    fontSize: THEME.fontSize.sm,
    fontFamily: THEME.fonts.bold,
    color: COLORS.haloGlow,
    marginBottom: THEME.spacing.xs,
  },
  streamTitle: {
    fontSize: THEME.fontSize.lg,
    fontFamily: THEME.fonts.bold,
    color: COLORS.softWhite,
    marginBottom: THEME.spacing.xs,
  },
  viewerCount: {
    fontSize: THEME.fontSize.sm,
    fontFamily: THEME.fonts.regular,
    color: COLORS.whisper,
  },
  controls: {
    paddingHorizontal: THEME.spacing.lg,
  },
  safetyPanel: {
    marginBottom: THEME.spacing.md,
  },
  safetyTitle: {
    fontSize: THEME.fontSize.md,
    fontFamily: THEME.fonts.bold,
    color: COLORS.softWhite,
    marginBottom: THEME.spacing.sm,
  },
  safetyButton: {
    paddingVertical: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  safetyButtonText: {
    fontSize: THEME.fontSize.sm,
    fontFamily: THEME.fonts.regular,
    color: COLORS.whisper,
  },
  footer: {
    padding: THEME.spacing.lg,
  },
});

export default LiveRoomScreen;
