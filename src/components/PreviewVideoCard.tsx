import React, { useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { PreviewMediaItem } from '../content/previewMedia';

type Props = {
  media: PreviewMediaItem;
  title?: string;
  category?: string;
  height?: number;
};

export function PreviewVideoCard({ media, title, category, height = 125 }: Props) {
  const [hovering, setHovering] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const engagedRef = useRef(false);
  const displayTitle = title ?? media.title;
  const displayCategory = category ?? media.category;

  const player = useVideoPlayer(media.videoUri, player => {
    player.loop = true;
    player.muted = true;
  });

  const startHoverPreview = () => {
    if (Platform.OS !== 'web' || engagedRef.current) return;
    player.loop = true;
    player.muted = true;
    setHovering(true);
    player.play();
  };

  const stopHoverPreview = () => {
    if (Platform.OS !== 'web' || engagedRef.current) return;
    player.pause();
    player.currentTime = 0;
    setHovering(false);
  };

  const openPlayback = () => {
    engagedRef.current = true;
    setEngaged(true);
    setHovering(false);
    player.loop = false;
    player.muted = false;
    player.play();
  };

  return (
    <View>
      <View style={[styles.media, { height }]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={engaged}
          fullscreenOptions={{ enable: true }}
        />
        {!engaged && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Preview video: ${displayTitle}`}
            onHoverIn={startHoverPreview}
            onHoverOut={stopHoverPreview}
            onPress={openPlayback}
            style={StyleSheet.absoluteFill}
          >
            {!hovering && <Image source={{ uri: media.posterUri }} resizeMode="cover" style={StyleSheet.absoluteFill} />}
            {!hovering && <View pointerEvents="none" style={styles.play}><Text style={styles.playText}>▶</Text></View>}
          </Pressable>
        )}
        <View pointerEvents="none" style={styles.badge}><Text style={styles.badgeText}>PREVIEW</Text></View>
      </View>
      <Text numberOfLines={1} style={styles.title}>{displayTitle}</Text>
      <Text numberOfLines={1} style={styles.category}>{displayCategory}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  media: {
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#090e0c',
  },
  play: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 38,
    height: 38,
    marginLeft: -19,
    marginTop: -19,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: {
    color: '#fff',
    fontSize: 15,
    marginLeft: 2,
  },
  badge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(20,26,24,.9)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 3,
  },
  badgeText: {
    color: '#eee',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: .4,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 9,
  },
  category: {
    color: '#9da6a0',
    fontSize: 11,
    marginTop: 5,
  },
});
