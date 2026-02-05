import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PALETTE, TYPOGRAPHY } from '../../constants/theme';

export default function CreatorDashboard() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Creator Insights</Text>
      
      {/* Earnings Overview */}
      <GlassPanel style={styles.statCard}>
        <Text style={styles.label}>Available for Payout</Text>
        <Text style={styles.value}>$1,420.50</Text>
        <View style={styles.payoutButton}>
          <Text style={styles.payoutText}>Request Payout via Stripe</Text>
        </View>
      </GlassPanel>

      {/* Safety Performance */}
      <GlassPanel style={styles.statCard}>
        <Text style={styles.label}>Guardian Status</Text>
        <Text style={[styles.value, {color: PALETTE.trustBlue}]}>Excellent</Text>
        <Text style={styles.subText}>No community violations in 30 days.</Text>
      </GlassPanel>

      {/* Audience Presence */}
      <View style={styles.row}>
        <GlassPanel style={styles.halfCard}>
          <Text style={styles.label}>Presence</Text>
          <Text style={styles.smallValue}>12.4k</Text>
        </GlassPanel>
        <GlassPanel style={styles.halfCard}>
          <Text style={styles.label}>Gifts</Text>
          <Text style={styles.smallValue}>842</Text>
        </GlassPanel>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.voidBlack, padding: 24 },
  header: { fontFamily: TYPOGRAPHY.bold, fontSize: 28, color: PALETTE.haloWhite, marginTop: 40, marginBottom: 24 },
  statCard: { padding: 24, marginBottom: 16 },
  label: { color: PALETTE.haloCyan, fontSize: 12, fontFamily: TYPOGRAPHY.bold, textTransform: 'uppercase' },
  value: { color: PALETTE.haloWhite, fontSize: 32, fontFamily: TYPOGRAPHY.bold, marginTop: 8 },
  smallValue: { color: PALETTE.haloWhite, fontSize: 24, fontFamily: TYPOGRAPHY.bold, marginTop: 4 },
  subText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 },
  payoutButton: { marginTop: 16, backgroundColor: 'rgba(58, 190, 255, 0.1)', padding: 12, borderRadius: 12, alignItems: 'center' },
  payoutText: { color: PALETTE.haloBlue, fontFamily: TYPOGRAPHY.bold },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfCard: { width: '48%', padding: 20 }
});
