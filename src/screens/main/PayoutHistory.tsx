import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PALETTE, TYPOGRAPHY, LAYOUT } from '../../constants/theme';

interface PayoutTransfer {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  created: number; // Unix timestamp
  arrival_date: number; // Unix timestamp
  description: string;
}

// Mock data representing Stripe transfers
const MOCK_TRANSFERS: PayoutTransfer[] = [
  {
    id: 'po_1234567890',
    amount: 1420.50,
    currency: 'usd',
    status: 'paid',
    created: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    arrival_date: Date.now() - 5 * 24 * 60 * 60 * 1000,
    description: 'Weekly earnings payout',
  },
  {
    id: 'po_0987654321',
    amount: 850.25,
    currency: 'usd',
    status: 'pending',
    created: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    arrival_date: Date.now() + 1 * 24 * 60 * 60 * 1000,
    description: 'Weekly earnings payout',
  },
  {
    id: 'po_1122334455',
    amount: 2105.75,
    currency: 'usd',
    status: 'paid',
    created: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
    arrival_date: Date.now() - 12 * 24 * 60 * 60 * 1000,
    description: 'Weekly earnings payout',
  },
  {
    id: 'po_5544332211',
    amount: 675.00,
    currency: 'usd',
    status: 'paid',
    created: Date.now() - 21 * 24 * 60 * 60 * 1000, // 21 days ago
    arrival_date: Date.now() - 19 * 24 * 60 * 60 * 1000,
    description: 'Weekly earnings payout',
  },
];

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return PALETTE.trustBlue;
    case 'pending':
      return PALETTE.warning;
    case 'failed':
      return '#EF4444';
    default:
      return PALETTE.haloWhite;
  }
};

const getStatusLabel = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function PayoutHistory() {
  const renderTransfer = ({ item }: { item: PayoutTransfer }) => (
    <GlassPanel style={styles.transferCard} intensity={10}>
      <View style={styles.transferHeader}>
        <View style={styles.transferInfo}>
          <Text style={styles.transferAmount}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
          <Text style={styles.transferDescription}>{item.description}</Text>
        </View>
        <Text 
          style={[
            styles.statusText, 
            { color: getStatusColor(item.status) }
          ]}
        >
          {getStatusLabel(item.status)}
        </Text>
      </View>
      
      <View style={styles.transferDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Initiated</Text>
          <Text style={styles.detailValue}>{formatDate(item.created)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Arrival</Text>
          <Text style={styles.detailValue}>{formatDate(item.arrival_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ID</Text>
          <Text style={styles.detailValue}>{item.id}</Text>
        </View>
      </View>
    </GlassPanel>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Payout History</Text>
        <Text style={styles.subheader}>Stripe Transfer Records</Text>
      </View>

      <FlatList
        data={MOCK_TRANSFERS}
        keyExtractor={(item) => item.id}
        renderItem={renderTransfer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.voidBlack,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 28,
    color: PALETTE.haloWhite,
    letterSpacing: TYPOGRAPHY.tracking,
  },
  subheader: {
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 14,
    color: PALETTE.haloCyan,
    marginTop: 4,
    letterSpacing: TYPOGRAPHY.tracking,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for tab bar
  },
  transferCard: {
    marginBottom: LAYOUT.spacing,
    padding: 20,
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  transferInfo: {
    flex: 1,
  },
  transferAmount: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 24,
    color: PALETTE.haloWhite,
    letterSpacing: TYPOGRAPHY.tracking,
    fontVariant: ['tabular-nums'],
  },
  transferDescription: {
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 14,
    color: 'rgba(234, 246, 255, 0.6)',
    marginTop: 4,
    letterSpacing: TYPOGRAPHY.tracking,
  },
  statusText: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transferDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 12,
    color: PALETTE.haloCyan,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 12,
    color: 'rgba(234, 246, 255, 0.7)',
    letterSpacing: TYPOGRAPHY.tracking,
    fontVariant: ['tabular-nums'],
  },
});
