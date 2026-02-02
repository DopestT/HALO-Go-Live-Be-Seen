import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PALETTE, TYPOGRAPHY, LAYOUT } from '../../constants/theme';

// Type definition for Stripe transfer/payout
interface StripePayout {
  id: string;
  amount: number; // Amount in cents
  currency: string;
  status: 'paid' | 'pending' | 'in_transit' | 'failed';
  created: number; // Unix timestamp
  arrival_date: number; // Unix timestamp
  destination: string; // Bank account last 4 digits
}

// Mock data representing Stripe transfer history
const MOCK_PAYOUTS: StripePayout[] = [
  {
    id: 'po_1234567890',
    amount: 142050, // $1,420.50
    currency: 'usd',
    status: 'paid',
    created: 1704067200, // Jan 1, 2024
    arrival_date: 1704153600,
    destination: '****4242',
  },
  {
    id: 'po_0987654321',
    amount: 89375, // $893.75
    currency: 'usd',
    status: 'pending',
    created: 1706745600, // Feb 1, 2024
    arrival_date: 1706832000,
    destination: '****4242',
  },
  {
    id: 'po_1122334455',
    amount: 256090, // $2,560.90
    currency: 'usd',
    status: 'paid',
    created: 1701475200, // Dec 2, 2023
    arrival_date: 1701561600,
    destination: '****4242',
  },
  {
    id: 'po_5544332211',
    amount: 67320, // $673.20
    currency: 'usd',
    status: 'in_transit',
    created: 1709424000, // Mar 3, 2024
    arrival_date: 1709510400,
    destination: '****4242',
  },
];

/**
 * Format amount in cents to currency with tabular numbers
 */
const formatCurrency = (amountInCents: number): string => {
  const dollars = Math.floor(amountInCents / 100);
  const cents = amountInCents % 100;
  
  // Format with commas for thousands
  const formattedDollars = dollars.toLocaleString('en-US');
  const formattedCents = cents.toString().padStart(2, '0');
  
  return `$${formattedDollars}.${formattedCents}`;
};

/**
 * Format Unix timestamp to readable date
 */
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
};

/**
 * Get status display text and color
 */
const getStatusDisplay = (status: string): { text: string; color: string } => {
  switch (status) {
    case 'paid':
      return { text: 'Completed', color: PALETTE.trustBlue };
    case 'pending':
      return { text: 'Pending', color: PALETTE.warning };
    case 'in_transit':
      return { text: 'In Transit', color: PALETTE.haloCyan };
    case 'failed':
      return { text: 'Failed', color: '#EF4444' }; // Red for error state
    default:
      return { text: 'Unknown', color: PALETTE.haloWhite };
  }
};

export default function PayoutHistory() {
  const renderPayoutItem = ({ item }: { item: StripePayout }) => {
    const statusDisplay = getStatusDisplay(item.status);
    
    return (
      <GlassPanel style={styles.payoutCard}>
        <View style={styles.payoutHeader}>
          <Text style={styles.payoutAmount}>{formatCurrency(item.amount)}</Text>
          <Text style={[styles.statusText, { color: statusDisplay.color }]}>
            {statusDisplay.text}
          </Text>
        </View>
        
        <View style={styles.payoutDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Initiated</Text>
            <Text style={styles.detailValue}>{formatDate(item.created)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expected Arrival</Text>
            <Text style={styles.detailValue}>{formatDate(item.arrival_date)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Destination</Text>
            <Text style={styles.detailValue}>{item.destination}</Text>
          </View>
        </View>
      </GlassPanel>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.header}>Payout History</Text>
        <Text style={styles.subtitle}>Your Stripe transfer history</Text>
      </View>

      <FlatList
        data={MOCK_PAYOUTS}
        keyExtractor={(item) => item.id}
        renderItem={renderPayoutItem}
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
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
  },
  header: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 28,
    color: PALETTE.haloWhite,
    letterSpacing: TYPOGRAPHY.tracking,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 14,
    color: 'rgba(234, 246, 255, 0.6)',
    marginTop: 4,
    letterSpacing: TYPOGRAPHY.tracking,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for tab bar
  },
  payoutCard: {
    marginBottom: LAYOUT.spacing,
    padding: 20,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  payoutAmount: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 24,
    color: PALETTE.haloWhite,
    fontVariant: ['tabular-nums'], // Tabular numbers for currency
    letterSpacing: TYPOGRAPHY.tracking,
  },
  statusText: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  payoutDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 14,
    color: PALETTE.haloCyan,
    letterSpacing: TYPOGRAPHY.tracking,
  },
  detailValue: {
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 14,
    color: PALETTE.haloWhite,
    fontVariant: ['tabular-nums'], // Tabular numbers for dates and amounts
    letterSpacing: TYPOGRAPHY.tracking,
  },
});
