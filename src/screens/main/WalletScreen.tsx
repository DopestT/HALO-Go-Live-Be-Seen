import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PALETTE, TYPOGRAPHY, LAYOUT } from '../../constants/theme';

const COIN_PACKS = [
  { id: '1', amount: 100, price: '$0.99' },
  { id: '2', amount: 500, price: '$4.99' },
  { id: '3', amount: 1200, price: '$9.99' },
];

export default function WalletScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Wallet</Text>
      
      <GlassPanel style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Coins</Text>
        <Text style={styles.balanceValue}>1,240</Text>
      </GlassPanel>

      <Text style={styles.sectionTitle}>Refill Coins</Text>
      <FlatList
        data={COIN_PACKS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.packItem}>
            <GlassPanel style={styles.packInner} intensity={10}>
              <Text style={styles.coinAmount}>{item.amount} Coins</Text>
              <Text style={styles.price}>{item.price}</Text>
            </GlassPanel>
          </TouchableOpacity>
        )}
      />
      
      <Text style={styles.disclaimer}>
        Digital goods are subject to Apple/Google billing terms.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.voidBlack, padding: 24 },
  header: { fontFamily: TYPOGRAPHY.bold, fontSize: 28, color: PALETTE.haloWhite, marginTop: 40, marginBottom: 32 },
  balanceCard: { width: '100%', padding: 32, alignItems: 'center', marginBottom: 40 },
  balanceLabel: { color: PALETTE.haloCyan, fontSize: 14, fontFamily: TYPOGRAPHY.regular, letterSpacing: 1 },
  balanceValue: { color: PALETTE.haloWhite, fontSize: 42, fontFamily: TYPOGRAPHY.bold, marginTop: 8 },
  sectionTitle: { color: PALETTE.haloWhite, fontSize: 18, fontFamily: TYPOGRAPHY.bold, marginBottom: 16 },
  packItem: { marginBottom: 12 },
  packInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  coinAmount: { color: PALETTE.haloWhite, fontSize: 16, fontFamily: TYPOGRAPHY.bold },
  price: { color: PALETTE.haloBlue, fontSize: 16, fontFamily: TYPOGRAPHY.bold },
  disclaimer: { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginTop: 20 }
});
