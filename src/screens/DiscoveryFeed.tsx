import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { filterContentForUser, Content } from '../utils/filterContentForUser';

interface FeedItem extends Content {
  username: string;
  viewerCount: number;
  thumbnailUrl?: string;
  description: string;
}

const mockFeedItems: FeedItem[] = [
  {
    id: '1',
    title: 'Creative Coding Session',
    username: 'developer_one',
    viewerCount: 127,
    isAdultContent: false,
    description: 'Building something interesting',
  },
  {
    id: '2',
    title: 'Music Production',
    username: 'producer_two',
    viewerCount: 89,
    isAdultContent: false,
    description: 'Late night beats',
  },
  {
    id: '3',
    title: 'Art Stream',
    username: 'artist_three',
    viewerCount: 203,
    isAdultContent: false,
    description: 'Digital painting session',
  },
];

export const DiscoveryFeed: React.FC = () => {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    setFeedItems(filterContentForUser(mockFeedItems, user));
  }, [user]);

  const columns = useMemo(() => {
    if (width >= 1500) return 3;
    if (width >= 820) return 2;
    return 1;
  }, [width]);

  const renderItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity style={styles.feedItem} activeOpacity={0.9}>
      <View style={styles.thumbnailContainer}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Text style={styles.placeholderText}>LIVE</Text>
          </View>
        )}
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <View style={styles.viewerBadge}>
          <Text style={styles.viewerCount}>{item.viewerCount.toLocaleString()} watching</Text>
        </View>
      </View>

      <View style={styles.contentInfo}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        key={`discovery-${columns}`}
        data={feedItems}
        numColumns={columns}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={columns > 1 ? styles.columnRow : undefined}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>HALO LIVE</Text>
              <Text style={styles.headerTitle}>Discover what is happening now.</Text>
            </View>
            <View style={styles.liveNowPill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveNowText}>{feedItems.length} LIVE</Text>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.voidBlack,
  },
  listContent: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },
  header: {
    width: '100%',
    minHeight: 150,
    paddingVertical: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderGray,
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  headerTitle: {
    maxWidth: 920,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  liveNowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glassBackground,
    marginLeft: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
    marginRight: 8,
  },
  liveNowText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  columnRow: {
    gap: 18,
  },
  feedItem: {
    flex: 1,
    minWidth: 0,
    marginBottom: 24,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.large,
    backgroundColor: theme.colors.darkGray,
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.darkGray,
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
    letterSpacing: 4,
  },
  liveBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.error,
  },
  liveText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  viewerBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewerCount: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#fff',
  },
  contentInfo: {
    paddingTop: 12,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 5,
  },
  username: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
});
