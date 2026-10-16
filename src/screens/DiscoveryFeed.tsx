import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { productIdentity } from '../product';
import { theme } from '../theme';

export const DiscoveryFeed: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>{productIdentity.name} LIVE</Text>
      <Text style={styles.title}>{productIdentity.tagline}</Text>
      <Text style={styles.copy}>
        Live discovery belongs here. This preview will show real broadcasts only after the verified discovery feed is connected.
      </Text>
      <Text style={styles.motto}>{productIdentity.motto}</Text>
    </View>

    <View style={styles.signalPanel}>
      <View style={styles.signalDot} />
      <View style={styles.signalCopy}>
        <Text style={styles.signalLabel}>NO VERIFIED LIVE SIGNALS YET</Text>
        <Text style={styles.signalDetail}>
          Mock creators, viewer counts, and fake live sessions have been removed from the public surface.
        </Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.voidBlack,
    paddingHorizontal: 24,
    paddingBottom: 56,
  },
  hero: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingTop: 72,
    paddingBottom: 54,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderGray,
  },
  eyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 18,
  },
  title: {
    maxWidth: 940,
    color: theme.colors.textPrimary,
    fontSize: 56,
    lineHeight: 62,
    fontWeight: '800',
    letterSpacing: -1.4,
  },
  copy: {
    maxWidth: 760,
    marginTop: 22,
    color: theme.colors.textSecondary,
    fontSize: 17,
    lineHeight: 27,
  },
  motto: {
    marginTop: 24,
    color: theme.colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signalPanel: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    marginTop: 28,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
    borderRadius: 16,
    backgroundColor: theme.colors.deepGray,
  },
  signalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 14,
    backgroundColor: theme.colors.textTertiary,
  },
  signalCopy: {
    flex: 1,
  },
  signalLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  signalDetail: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
});
