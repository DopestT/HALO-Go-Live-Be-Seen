import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { listVideos, PublicApiError } from '../api/publicClient';
import type { VideoWithEngagement } from '../api/types';
import { AsyncState } from '../components/media/AsyncState';
import { MediaGrid } from '../components/media/MediaGrid';
import { productIdentity } from '../product';
import { theme } from '../theme';

export type LaneStatus = 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';
export type VideoLoader = typeof listVideos;

export const laneStatusFromError = (error: unknown): LaneStatus =>
  error instanceof PublicApiError && (error.code === 'not_configured' || error.code === 'unavailable')
    ? 'unavailable'
    : 'error';

export const loadLiveVideos = (loader: VideoLoader = listVideos) => loader({ live: true });

export const DiscoveryFeedView = ({
  status,
  videos,
  onOpen,
}: {
  status: LaneStatus;
  videos: VideoWithEngagement[];
  onOpen: (videoId: number) => void;
}) => {
  if (status !== 'ready') {
    return <AsyncState state={status} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{productIdentity.name} LIVE</Text>
        <Text style={styles.title}>Live now, from the source.</Text>
        <Text style={styles.copy}>
          Every card below comes from the connected NSCENE video API. LIVE labels and counts reflect returned backend state only.
        </Text>
      </View>
      <MediaGrid videos={videos} onOpen={onOpen} />
    </ScrollView>
  );
};

export const DiscoveryFeed: React.FC<{ onOpen: (videoId: number) => void }> = ({ onOpen }) => {
  const [status, setStatus] = useState<LaneStatus>('loading');
  const [videos, setVideos] = useState<VideoWithEngagement[]>([]);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    loadLiveVideos()
      .then((records) => {
        if (!active) return;
        setVideos(records);
        setStatus(records.length === 0 ? 'empty' : 'ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setVideos([]);
        setStatus(laneStatusFromError(error));
      });
    return () => {
      active = false;
    };
  }, []);

  return <DiscoveryFeedView status={status} videos={videos} onOpen={onOpen} />;
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
    width: '100%',
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  eyebrow: {
    color: theme.colors.liveRed,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginBottom: 12,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '800',
  },
  copy: {
    maxWidth: 760,
    marginTop: 14,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
});
