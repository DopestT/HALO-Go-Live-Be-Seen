import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { listCreators, PublicApiError } from '../api/publicClient';
import type { PublicCreator } from '../api/types';
import { CreatorCard } from '../components/creator/CreatorCard';
import { AsyncState } from '../components/media/AsyncState';
import { theme } from '../theme';

export type CreatorDirectoryStatus = 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';
export type CreatorLister = typeof listCreators;

export const loadCreators = (loader: CreatorLister = listCreators) => loader({ limit: 40, offset: 0 });

export const creatorDirectoryStatusFromError = (error: unknown): CreatorDirectoryStatus =>
  error instanceof PublicApiError && (error.code === 'not_configured' || error.code === 'unavailable')
    ? 'unavailable'
    : 'error';

export const CreatorsView = ({
  status,
  creators,
  onOpen,
}: {
  status: CreatorDirectoryStatus;
  creators: PublicCreator[];
  onOpen: (creatorId: number) => void;
}) => {
  if (status !== 'ready') return <AsyncState state={status} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>CREATORS</Text>
        <Text style={styles.title}>The people behind the signal.</Text>
        <Text style={styles.description}>
          Public creator profiles returned by the NSCENE backend. No follower totals or verification claims are inferred.
        </Text>
      </View>
      <View style={styles.grid}>
        {creators.map((creator) => (
          <CreatorCard key={creator.id} creator={creator} onOpen={onOpen} />
        ))}
      </View>
    </ScrollView>
  );
};

export const CreatorsScreen: React.FC<{ onOpen: (creatorId: number) => void }> = ({ onOpen }) => {
  const [status, setStatus] = useState<CreatorDirectoryStatus>('loading');
  const [creators, setCreators] = useState<PublicCreator[]>([]);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    loadCreators()
      .then((records) => {
        if (!active) return;
        setCreators(records);
        setStatus(records.length ? 'ready' : 'empty');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCreators([]);
        setStatus(creatorDirectoryStatusFromError(error));
      });
    return () => {
      active = false;
    };
  }, []);

  return <CreatorsView status={status} creators={creators} onOpen={onOpen} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.base,
  },
  content: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 72,
    gap: 28,
  },
  hero: {
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  eyebrow: {
    color: theme.colors.signalBlue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  title: {
    marginTop: 12,
    color: theme.colors.textPrimary,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '800',
  },
  description: {
    maxWidth: 760,
    marginTop: 14,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 20,
  },
});
