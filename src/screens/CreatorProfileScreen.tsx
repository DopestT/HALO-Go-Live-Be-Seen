import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCreator, listUserVideos, PublicApiError } from '../api/publicClient';
import type { PublicCreator, VideoWithEngagement } from '../api/types';
import { AsyncState } from '../components/media/AsyncState';
import { MediaGrid } from '../components/media/MediaGrid';
import { theme } from '../theme';

export type CreatorProfileStatus = 'loading' | 'ready' | 'unavailable' | 'error' | 'not-found';
export type CreatorGetter = typeof getCreator;
export type UserVideoLister = typeof listUserVideos;

export const creatorProfileStatusFromError = (error: unknown): CreatorProfileStatus => {
  if (error instanceof PublicApiError) {
    if (error.status === 404 || error.code === 'not_found') return 'not-found';
    if (error.code === 'not_configured' || error.code === 'unavailable') return 'unavailable';
  }
  return 'error';
};

export const loadCreatorProfile = async (
  id: number,
  creatorLoader: CreatorGetter = getCreator,
  videoLoader: UserVideoLister = listUserVideos,
) => {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new PublicApiError('invalid_request', 'Invalid creator ID.');
  }
  const [creator, videos] = await Promise.all([
    creatorLoader(id),
    videoLoader(id, { limit: 40, offset: 0 }),
  ]);
  return { creator, videos };
};

export const CreatorProfileView = ({
  status,
  creator,
  videos,
  onOpenVideo,
}: {
  status: CreatorProfileStatus;
  creator: PublicCreator | null;
  videos: VideoWithEngagement[];
  onOpenVideo: (videoId: number) => void;
}) => {
  if (status !== 'ready' || !creator) return <AsyncState state={status === 'ready' ? 'error' : status} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profile}>
        {creator.avatar_url ? (
          <Image
            accessibilityLabel={`Avatar for ${creator.display_name || creator.username}`}
            source={{ uri: creator.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{(creator.display_name || creator.username).slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{creator.display_name || creator.username}</Text>
          <Text style={styles.username}>@{creator.username}</Text>
          {creator.bio ? <Text style={styles.bio}>{creator.bio}</Text> : null}
        </View>
      </View>

      <View style={styles.uploadsHeader}>
        <Text style={styles.uploadsTitle}>VIDEOS</Text>
      </View>
      {videos.length ? (
        <MediaGrid videos={videos} onOpen={onOpenVideo} />
      ) : (
        <AsyncState state="empty" message="This creator has no verified videos available right now." />
      )}
    </ScrollView>
  );
};

export const CreatorProfileScreen: React.FC<{
  id: number;
  onOpenVideo: (videoId: number) => void;
}> = ({ id, onOpenVideo }) => {
  const [status, setStatus] = useState<CreatorProfileStatus>('loading');
  const [creator, setCreator] = useState<PublicCreator | null>(null);
  const [videos, setVideos] = useState<VideoWithEngagement[]>([]);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setCreator(null);
    setVideos([]);

    loadCreatorProfile(id)
      .then((result) => {
        if (!active) return;
        setCreator(result.creator);
        setVideos(result.videos);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatus(creatorProfileStatusFromError(error));
      });

    return () => {
      active = false;
    };
  }, [id]);

  return <CreatorProfileView status={status} creator={creator} videos={videos} onOpenVideo={onOpenVideo} />;
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
    paddingTop: 42,
    paddingBottom: 72,
    gap: 28,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.elevated,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.elevated,
  },
  avatarInitial: {
    color: theme.colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  username: {
    marginTop: 4,
    color: theme.colors.signalBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  bio: {
    maxWidth: 720,
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  uploadsHeader: {
    paddingTop: 4,
  },
  uploadsTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
