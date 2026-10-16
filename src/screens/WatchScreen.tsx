import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getVideo, PublicApiError } from '../api/publicClient';
import type { VideoWithEngagement } from '../api/types';
import { AsyncState } from '../components/media/AsyncState';
import { VideoPlayer } from '../components/media/VideoPlayer';
import { theme } from '../theme';

export type WatchStatus = 'loading' | 'ready' | 'no-stream' | 'unavailable' | 'error' | 'not-found';
export type VideoGetter = typeof getVideo;

export const loadWatchVideo = (id: number, loader: VideoGetter = getVideo) => {
  if (!Number.isSafeInteger(id) || id < 1) {
    return Promise.reject(new PublicApiError('invalid_request', 'Invalid video ID.'));
  }
  return loader(id);
};

export const watchStatusFromError = (error: unknown): WatchStatus => {
  if (error instanceof PublicApiError) {
    if (error.status === 404 || error.code === 'not_found') return 'not-found';
    if (error.code === 'not_configured' || error.code === 'unavailable') return 'unavailable';
  }
  return 'error';
};

export const WatchScreenView = ({
  status,
  video,
}: {
  status: WatchStatus;
  video: VideoWithEngagement | null;
}) => {
  if (status === 'loading' || status === 'unavailable' || status === 'error' || status === 'not-found') {
    return <AsyncState state={status} />;
  }

  if (status === 'no-stream' || !video?.stream_url) {
    return (
      <AsyncState
        state="unavailable"
        message="This NSCENE video does not currently have a playable stream URL."
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.playerWrap}>
        <VideoPlayer streamUrl={video.stream_url} title={video.title} />
      </View>
      <View style={styles.meta}>
        <View style={styles.titleRow}>
          {video.is_live ? (
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{video.title}</Text>
        </View>
        <Text style={styles.creator}>Creator #{video.user_id}</Text>
        <View style={styles.metrics}>
          <Text style={styles.metric}>{video.view_count} views</Text>
          {video.is_live ? <Text style={styles.metric}>{video.live_viewers} watching</Text> : null}
          <Text style={styles.metric}>{video.like_count} likes</Text>
          <Text style={styles.metric}>{video.comment_count} comments</Text>
        </View>
        {video.description ? <Text style={styles.description}>{video.description}</Text> : null}
      </View>
    </ScrollView>
  );
};

export const WatchScreen: React.FC<{ id: number }> = ({ id }) => {
  const [status, setStatus] = useState<WatchStatus>('loading');
  const [video, setVideo] = useState<VideoWithEngagement | null>(null);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setVideo(null);

    loadWatchVideo(id)
      .then((record) => {
        if (!active) return;
        setVideo(record);
        setStatus(record.stream_url ? 'ready' : 'no-stream');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatus(watchStatusFromError(error));
      });

    return () => {
      active = false;
    };
  }, [id]);

  return <WatchScreenView status={status} video={video} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.base,
  },
  content: {
    width: '100%',
    maxWidth: 1220,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 72,
  },
  playerWrap: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.large,
    backgroundColor: '#000000',
  },
  meta: {
    paddingTop: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  liveBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.liveRed,
  },
  liveText: {
    color: theme.colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    flexShrink: 1,
    color: theme.colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  creator: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
  },
  metric: {
    color: theme.colors.textTertiary,
    fontSize: 13,
  },
  description: {
    maxWidth: 860,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
});
