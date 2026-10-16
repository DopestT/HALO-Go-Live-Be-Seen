import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { VideoWithEngagement } from '../../api/types';
import { theme } from '../../theme';

export interface MediaCardProps {
  video: VideoWithEngagement;
  onOpen: (videoId: number) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ video, onOpen }) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={`Open ${video.title}`}
    onPress={() => onOpen(video.id)}
    style={styles.card}
  >
    <View style={styles.media}>
      {video.thumbnail_url ? (
        <Image
          accessibilityLabel={`Thumbnail for ${video.title}`}
          source={{ uri: video.thumbnail_url }}
          resizeMode="cover"
          style={styles.image}
        />
      ) : (
        <View accessibilityLabel="No thumbnail available" style={styles.placeholder} />
      )}
      {video.is_live ? (
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      ) : null}
    </View>

    <View style={styles.body}>
      <Text numberOfLines={2} style={styles.title}>{video.title}</Text>
      <Text style={styles.creator}>Creator #{video.user_id}</Text>
      <View style={styles.metrics}>
        <Text style={styles.metric}>{video.view_count} views</Text>
        {video.is_live ? <Text style={styles.metric}>{video.live_viewers} watching</Text> : null}
        <Text style={styles.metric}>{video.like_count} likes</Text>
        <Text style={styles.metric}>{video.comment_count} comments</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: 460,
    minWidth: 240,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.card,
  },
  media: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.elevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: theme.colors.elevated,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.liveRed,
  },
  liveText: {
    color: theme.colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  body: {
    padding: theme.spacing.md,
    gap: 7,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  creator: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  metric: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
});
