import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { theme } from '../theme';

interface LiveStreamOverlayProps {
  streamId: string;
  streamTitle: string;
  username: string;
  viewerCount: number;
  onClose: () => void;
}

export const LiveStreamOverlay: React.FC<LiveStreamOverlayProps> = ({
  streamId,
  streamTitle,
  username,
  viewerCount,
  onClose,
}) => {
  const [showReportConfirmation, setShowReportConfirmation] = useState(false);
  const [reported, setReported] = useState(false);

  const handleReport = () => {
    // One-tap reporting - immediately mark as reported
    setReported(true);
    setShowReportConfirmation(true);
    
    // In production, send report to backend
    console.log(`Reported stream: ${streamId}`);
    
    // Auto-hide confirmation after 2 seconds
    setTimeout(() => {
      setShowReportConfirmation(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.streamInfo}>
          <Text style={styles.streamTitle} numberOfLines={1}>
            {streamTitle}
          </Text>
          <Text style={styles.username}>@{username}</Text>
        </View>

        <View style={styles.viewerContainer}>
          <Text style={styles.viewerCount}>{viewerCount}</Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[styles.reportButton, reported && styles.reportButtonDisabled]}
          onPress={handleReport}
          disabled={reported}
        >
          <Text style={styles.reportButtonText}>
            {reported ? 'Reported' : 'Report'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Report Confirmation Modal */}
      <Modal
        visible={showReportConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportConfirmation(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowReportConfirmation(false)}
        >
          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationText}>Report submitted</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.voidBlack,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.glassBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  streamInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  streamTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  username: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  viewerContainer: {
    backgroundColor: theme.colors.darkGray,
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
    marginRight: theme.spacing.md,
  },
  viewerCount: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
  },
  closeButtonText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bottomControls: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.md,
  },
  reportButton: {
    backgroundColor: theme.colors.glassBackground,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.small,
  },
  reportButtonDisabled: {
    opacity: 0.5,
  },
  reportButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmationCard: {
    backgroundColor: theme.colors.glassBackground,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.medium,
  },
  confirmationText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
