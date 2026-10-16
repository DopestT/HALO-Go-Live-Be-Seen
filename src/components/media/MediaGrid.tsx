import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { VideoWithEngagement } from '../../api/types';
import { theme } from '../../theme';
import { MediaCard } from './MediaCard';

export const MediaGrid = ({
  videos,
  onOpen,
}: {
  videos: VideoWithEngagement[];
  onOpen: (videoId: number) => void;
}) => (
  <View style={styles.grid}>
    {videos.map((video) => (
      <MediaCard key={video.id} video={video} onOpen={onOpen} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: theme.spacing.lg,
  },
});
