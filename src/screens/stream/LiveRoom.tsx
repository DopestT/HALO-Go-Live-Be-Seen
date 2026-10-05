import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PALETTE, TYPOGRAPHY } from '../../constants/theme';

export default function LiveRoom({ isCreator = false }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 1000;

  return (
    <View style={styles.container}>
      <View style={styles.videoPlaceholder}>
        <View style={styles.videoCenterMark}>
          <Text style={styles.videoCenterText}>LIVE VIDEO</Text>
        </View>
      </View>

      <View style={[styles.header, isWide && styles.headerWide]}>
        <View style={styles.headerCluster}>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <GlassPanel style={styles.presenceBadge} intensity={10}>
            <Text style={styles.presenceText}>1.2k watching</Text>
          </GlassPanel>
          {isCreator && (
            <GlassPanel style={styles.creatorBadge} intensity={10}>
              <Text style={styles.creatorBadgeText}>CREATOR VIEW</Text>
            </GlassPanel>
          )}
        </View>

        <TouchableOpacity onPress={() => setShowReportModal(true)}>
          <GlassPanel style={styles.reportButton} intensity={15}>
            <Text style={styles.reportButtonText}>REPORT</Text>
          </GlassPanel>
        </TouchableOpacity>
      </View>

      <View style={[styles.streamMeta, isWide && styles.streamMetaWide]}>
        <Text style={styles.streamTitle}>Live community broadcast</Text>
        <Text style={styles.streamCreator}>@creator · Independent Live Network</Text>
      </View>

      <View style={[styles.interactionLayer, isWide && styles.interactionLayerWide]}>
        <GlassPanel style={[styles.chatPanel, isWide && styles.chatPanelWide]} intensity={18}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Live chat</Text>
            <Text style={styles.chatCount}>1.2k</Text>
          </View>
          <ScrollView style={styles.chatScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.chatMessage}>
              <Text style={styles.chatUser}>SkyGuardian: </Text>
              The aura here is incredible tonight.
            </Text>
            <Text style={styles.chatMessage}>
              <Text style={styles.chatUser}>MayaDC: </Text>
              Glad this is live. Sending this to our chapter.
            </Text>
          </ScrollView>

          <View style={styles.actionRow}>
            <View style={styles.inputPlaceholder}>
              <Text style={styles.inputPlaceholderText}>Send a message...</Text>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </GlassPanel>
      </View>

      {showReportModal && (
        <View style={styles.modalOverlay}>
          <GlassPanel style={styles.reportModal}>
            <Text style={styles.modalTitle}>Guardian Report</Text>
            <TouchableOpacity style={styles.reportOption}>
              <Text style={styles.optionText}>Safety concern</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reportOption}>
              <Text style={styles.optionText}>Harassment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reportOption}>
              <Text style={styles.optionText}>Impersonation or fraud</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowReportModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </GlassPanel>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: PALETTE.voidBlack,
    overflow: 'hidden',
  },
  videoPlaceholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCenterMark: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  videoCenterText: {
    color: 'rgba(255,255,255,0.24)',
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 12,
    letterSpacing: 3,
  },
  header: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerWide: {
    left: 28,
    right: 28,
  },
  headerCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#e11d48',
  },
  liveBadgeText: {
    color: '#fff',
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  presenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presenceText: {
    color: PALETTE.haloWhite,
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 12,
  },
  creatorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  creatorBadgeText: {
    color: PALETTE.haloCyan,
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  reportButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  reportButtonText: {
    color: PALETTE.warning,
    fontSize: 11,
    fontFamily: TYPOGRAPHY.bold,
  },
  streamMeta: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 260,
  },
  streamMetaWide: {
    right: 420,
    bottom: 30,
  },
  streamTitle: {
    color: '#fff',
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 24,
  },
  streamCreator: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 13,
    marginTop: 6,
  },
  interactionLayer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
  },
  interactionLayerWide: {
    top: 82,
    bottom: 24,
    left: 'auto',
    right: 24,
    width: 360,
  },
  chatPanel: {
    width: '100%',
    height: 220,
    padding: 14,
  },
  chatPanelWide: {
    height: '100%',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  chatTitle: {
    color: '#fff',
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 14,
  },
  chatCount: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 12,
  },
  chatScroll: {
    flex: 1,
    paddingTop: 12,
  },
  chatUser: {
    color: PALETTE.haloCyan,
    fontFamily: TYPOGRAPHY.bold,
  },
  chatMessage: {
    color: PALETTE.haloWhite,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  inputPlaceholder: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputPlaceholderText: {
    color: 'rgba(255,255,255,0.42)',
  },
  actionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PALETTE.haloBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 24,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  reportModal: {
    width: '100%',
    maxWidth: 520,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    color: PALETTE.haloWhite,
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 20,
    marginBottom: 20,
  },
  reportOption: {
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  optionText: {
    color: PALETTE.haloWhite,
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
  },
  closeButtonText: {
    color: PALETTE.haloCyan,
  },
});
