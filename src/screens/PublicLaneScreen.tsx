import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PublicSection } from '../product';
import { theme } from '../theme';

type PublicLane = Exclude<PublicSection, 'live'>;

const laneContent: Record<PublicLane, { label: string; headline: string; copy: string }> = {
  uploads: {
    label: 'UPLOADS',
    headline: 'Watch beyond the live moment.',
    copy: 'Long-form and uploaded video will appear here when the verified media feed is connected.',
  },
  clips: {
    label: 'CLIPS',
    headline: 'The moments worth replaying.',
    copy: 'Short clips will appear here when the verified clips feed is connected.',
  },
  shows: {
    label: 'SHOWS',
    headline: 'Programming with a place to live.',
    copy: 'Series and episodic programming will appear here when the verified shows feed is connected.',
  },
  creators: {
    label: 'CREATORS',
    headline: 'Find the people behind the signal.',
    copy: 'Creator discovery will appear here when verified creator profiles are connected.',
  },
  communities: {
    label: 'COMMUNITIES',
    headline: 'Gather around what matters.',
    copy: 'Community spaces will appear here when verified community data is connected.',
  },
};

export const PublicLaneScreen = ({ section }: { section: PublicLane }) => {
  const content = laneContent[section];

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow}>{content.label}</Text>
        <Text style={styles.headline}>{content.headline}</Text>
        <Text style={styles.copy}>{content.copy}</Text>
        <View style={styles.status}>
          <Text style={styles.statusText}>NO FABRICATED ACTIVITY</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.voidBlack,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  inner: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderGray,
    paddingTop: 48,
  },
  eyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 16,
  },
  headline: {
    color: theme.colors.textPrimary,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '700',
    maxWidth: 820,
  },
  copy: {
    color: theme.colors.textSecondary,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 720,
    marginTop: 20,
  },
  status: {
    alignSelf: 'flex-start',
    marginTop: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
    borderRadius: 999,
  },
  statusText: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
});
