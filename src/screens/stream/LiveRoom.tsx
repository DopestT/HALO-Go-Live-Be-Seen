import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PALETTE, TYPOGRAPHY, LAYOUT } from '../../constants/theme';

export default function LiveRoom({ isCreator = false }) {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <View style={styles.container}>
      {/* LIVEKIT VIDEO VIEW 
         Full-bleed video feed (Placeholder) 
      */}
      <View style={styles.videoPlaceholder} />

      {/* Top Header: Presence Stats */}
      <View style={styles.header}>
        <GlassPanel style={styles.presenceBadge} intensity={10}>
          <Text style={styles.presenceText}>1.2k Presence</Text>
        </GlassPanel>
        
        <TouchableOpacity onPress={() => setShowReportModal(true)}>
          <GlassPanel style={styles.reportButton} intensity={15}>
            <Text style={{color: PALETTE.warning, fontSize: 12}}>REPORT</Text>
          </GlassPanel>
        </TouchableOpacity>
      </View>

      {/* Bottom Interface: Chat & Interaction */}
      <View style={styles.interactionLayer}>
        <GlassPanel style={styles.chatPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.chatMessage}>
              <Text style={styles.chatUser}>SkyGuardian: </Text>
              The aura here is incredible tonight.
            </Text>
            {/* Additional messages fade in gently */}
          </ScrollView>
        </GlassPanel>

        <View style={styles.actionRow}>
          <GlassPanel style={styles.inputPlaceholder}>
            <Text style={{color: 'rgba(255,255,255,0.4)'}}>Send a message...</Text>
          </GlassPanel>
          <TouchableOpacity style={styles.giftButton}>
            <View style={styles.haloRingSmall} /> 
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Overlay (The Guardian) */}
      {showReportModal && (
        <View style={styles.modalOverlay}>
          <GlassPanel style={styles.reportModal}>
            <Text style={styles.modalTitle}>Guardian Report</Text>
            <TouchableOpacity style={styles.reportOption}>
              <Text style={styles.optionText}>Underage Presence</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reportOption}>
              <Text style={styles.optionText}>Harassment</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowReportModal(false)}
              style={styles.closeButton}
            >
              <Text style={{color: PALETTE.haloCyan}}>Dismiss</Text>
            </TouchableOpacity>
          </GlassPanel>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.voidBlack },
  videoPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#020617' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presenceBadge: { paddingHorizontal: 12, paddingVertical: 6 },
  presenceText: { color: PALETTE.haloWhite, fontFamily: TYPOGRAPHY.bold, fontSize: 12 },
  interactionLayer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  chatPanel: { height: 160, marginBottom: 16, padding: 12 },
  chatUser: { color: PALETTE.haloCyan, fontFamily: TYPOGRAPHY.bold },
  chatMessage: { color: PALETTE.haloWhite, fontSize: 14, marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  inputPlaceholder: { flex: 1, height: 50, justifyContent: 'center', paddingLeft: 20, marginRight: 12 },
  giftButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: PALETTE.haloBlue, alignItems: 'center', justifyContent: 'center' },
  haloRingSmall: { width: 20, height: 10, borderRadius: 10, borderWidth: 1, borderColor: PALETTE.voidBlack },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 30 },
  reportModal: { padding: 24, alignItems: 'center' },
  modalTitle: { color: PALETTE.haloWhite, fontFamily: TYPOGRAPHY.bold, fontSize: 18, marginBottom: 20 },
  reportOption: { width: '100%', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  optionText: { color: PALETTE.haloWhite, fontSize: 16 },
  closeButton: { marginTop: 20 }
});
