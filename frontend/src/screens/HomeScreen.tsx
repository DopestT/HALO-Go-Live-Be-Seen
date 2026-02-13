import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { GlassPanel } from '../components';
import { THEME, COLORS } from '../constants';
import { useAuth } from '../contexts';
import { filterContentForUser } from '../utils';

interface Stream {
  id: string;
  hostName: string;
  title: string;
  viewerCount: number;
  isAdultContent: boolean;
  isLive: boolean;
}

interface HomeScreenProps {
  navigation: any;
}

/**
 * Home Screen - Main feed of live streams
 * MUST use filterContentForUser to gate 18+ content
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  
  // Mock data - replace with actual API call
  const [streams] = useState<Stream[]>([
    {
      id: '1',
      hostName: 'Guardian',
      title: 'Calm Evening Chat',
      viewerCount: 42,
      isAdultContent: false,
      isLive: true,
    },
    {
      id: '2',
      hostName: 'Presence',
      title: 'Mindful Morning',
      viewerCount: 18,
      isAdultContent: false,
      isLive: true,
    },
  ]);

  // Filter content based on user settings
  const filteredStreams = filterContentForUser(streams, user);

  const handleStreamPress = (streamId: string) => {
    navigation.navigate('LiveRoom', { streamId });
  };

  const handleGoLive = () => {
    // TODO: Navigate to Go Live flow
    console.log('Go Live pressed');
  };

  const renderStream = ({ item }: { item: Stream }) => (
    <TouchableOpacity onPress={() => handleStreamPress(item.id)}>
      <GlassPanel style={styles.streamCard}>
        <View style={styles.streamHeader}>
          <Text style={styles.hostName}>{item.hostName}</Text>
          {item.isAdultContent && (
            <View style={styles.adultBadge}>
              <Text style={styles.adultText}>18+</Text>
            </View>
          )}
        </View>
        <Text style={styles.streamTitle}>{item.title}</Text>
        <Text style={styles.viewerCount}>
          {item.viewerCount} viewer{item.viewerCount !== 1 ? 's' : ''}
        </Text>
      </GlassPanel>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HALO</Text>
        <Text style={styles.subtitle}>Live Now</Text>
      </View>

      <FlatList
        data={filteredStreams}
        renderItem={renderStream}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No live streams at the moment</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.voidBlack,
  },
  header: {
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xxl,
  },
  title: {
    fontSize: THEME.fontSize.xxxl,
    fontFamily: THEME.fonts.bold,
    color: COLORS.softWhite,
  },
  subtitle: {
    fontSize: THEME.fontSize.md,
    fontFamily: THEME.fonts.regular,
    color: COLORS.whisper,
    marginTop: THEME.spacing.xs,
  },
  listContainer: {
    padding: THEME.spacing.lg,
  },
  streamCard: {
    marginBottom: THEME.spacing.md,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  hostName: {
    fontSize: THEME.fontSize.sm,
    fontFamily: THEME.fonts.bold,
    color: COLORS.haloGlow,
  },
  adultBadge: {
    backgroundColor: COLORS.adult18Plus,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.radius.small,
  },
  adultText: {
    fontSize: THEME.fontSize.xs,
    fontFamily: THEME.fonts.bold,
    color: COLORS.softWhite,
  },
  streamTitle: {
    fontSize: THEME.fontSize.lg,
    fontFamily: THEME.fonts.bold,
    color: COLORS.softWhite,
    marginBottom: THEME.spacing.xs,
  },
  viewerCount: {
    fontSize: THEME.fontSize.sm,
    fontFamily: THEME.fonts.regular,
    color: COLORS.whisper,
  },
  emptyText: {
    fontSize: THEME.fontSize.md,
    fontFamily: THEME.fonts.regular,
    color: COLORS.whisper,
    textAlign: 'center',
    marginTop: THEME.spacing.xxl,
  },
});
