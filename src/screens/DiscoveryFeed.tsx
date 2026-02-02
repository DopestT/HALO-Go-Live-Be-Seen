import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
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

// Mock data for demonstration
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
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    // Filter content based on user settings
    const filtered = filterContentForUser(mockFeedItems, user);
    setFeedItems(filtered);
  }, [user]);

  const renderItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity style={styles.feedItem}>
      <View style={styles.thumbnailContainer}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Text style={styles.placeholderText}>LIVE</Text>
          </View>
        )}
        <View style={styles.viewerBadge}>
          <Text style={styles.viewerCount}>{item.viewerCount}</Text>
        </View>
      </View>

      <View style={styles.contentInfo}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.voidBlack,
  },
  header: {
    paddingHorizontal: theme.layout.contentPadding,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderGray,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  listContent: {
    paddingHorizontal: theme.layout.contentPadding,
    paddingTop: theme.spacing.lg,
  },
  feedItem: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.darkGray,
  },
  placeholderThumbnail: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  viewerBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.glassBackground,
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  viewerCount: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  contentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  username: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
    fontVariant: ['tabular-nums'],
  },
  separator: {
    height: theme.layout.feedItemSpacing,
  },
});
