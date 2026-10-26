import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { listCreators, listVideos } from '../api/publicClient';
import type {
  PaginationOptions,
  PublicCreator,
  VideoListOptions,
  VideoWithEngagement,
} from '../api/types';
import { CreatorCard } from '../components/creator/CreatorCard';
import { MediaGrid } from '../components/media/MediaGrid';
import { theme } from '../theme';

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'unavailable';
export type SearchResults = {
  videos: VideoWithEngagement[];
  creators: PublicCreator[];
};

type VideoLoader = (options: VideoListOptions) => Promise<VideoWithEngagement[]>;
type CreatorLoader = (options: PaginationOptions) => Promise<PublicCreator[]>;

const includesQuery = (values: string[], query: string): boolean =>
  values.some((value) => value.toLocaleLowerCase().includes(query));

export const searchPublicRecords = async (
  query: string,
  videoLoader: VideoLoader = listVideos,
  creatorLoader: CreatorLoader = listCreators,
): Promise<SearchResults> => {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return { videos: [], creators: [] };

  const [liveVideos, uploads, creators] = await Promise.all([
    videoLoader({ live: true, limit: 50, offset: 0 }),
    videoLoader({ live: false, limit: 50, offset: 0 }),
    creatorLoader({ limit: 50, offset: 0 }),
  ]);

  const matchingVideos = new Map<number, VideoWithEngagement>();
  for (const video of [...liveVideos, ...uploads]) {
    if (includesQuery([video.title, video.description], normalized)) {
      matchingVideos.set(video.id, video);
    }
  }

  return {
    videos: [...matchingVideos.values()],
    creators: creators.filter((creator) =>
      includesQuery(
        [creator.username, creator.display_name, creator.bio],
        normalized,
      ),
    ),
  };
};

export const SearchView = ({
  status,
  query,
  input,
  videos,
  creators,
  onInputChange,
  onSubmit,
  onOpenVideo,
  onOpenCreator,
}: {
  status: SearchStatus;
  query: string;
  input: string;
  videos: VideoWithEngagement[];
  creators: PublicCreator[];
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onOpenVideo: (videoId: number) => void;
  onOpenCreator: (creatorId: number) => void;
}) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>SEARCH</Text>
      <Text style={styles.title}>Find the signal.</Text>
      <Text style={styles.description}>
        Search the real videos and creator profiles currently returned by NSCENE. Results are bounded to the connected public catalog and never filled with invented activity.
      </Text>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="Search NSCENE"
          autoCapitalize="none"
          returnKeyType="search"
          value={input}
          onChangeText={onInputChange}
          onSubmitEditing={onSubmit}
          placeholder="Search videos and creators"
          placeholderTextColor={theme.colors.textTertiary}
          style={styles.input}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Submit NSCENE search"
          onPress={onSubmit}
          style={styles.searchButton}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>

    {status === 'idle' ? (
      <Text style={styles.stateText}>Search videos and creators on NSCENE.</Text>
    ) : null}
    {status === 'loading' ? (
      <Text style={styles.stateText}>Searching verified NSCENE records…</Text>
    ) : null}
    {status === 'empty' ? (
      <Text style={styles.stateText}>No verified results for “{query}”.</Text>
    ) : null}
    {status === 'unavailable' ? (
      <Text style={styles.stateText}>Search is unavailable right now.</Text>
    ) : null}

    {status === 'ready' && videos.length ? (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VIDEOS</Text>
        <MediaGrid videos={videos} onOpen={onOpenVideo} />
      </View>
    ) : null}

    {status === 'ready' && creators.length ? (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CREATORS</Text>
        <View style={styles.creatorGrid}>
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} onOpen={onOpenCreator} />
          ))}
        </View>
      </View>
    ) : null}
  </ScrollView>
);

export const SearchScreen = ({
  query,
  onSearch,
  onOpenVideo,
  onOpenCreator,
}: {
  query: string;
  onSearch: (query: string) => void;
  onOpenVideo: (videoId: number) => void;
  onOpenCreator: (creatorId: number) => void;
}) => {
  const [input, setInput] = useState(query);
  const [status, setStatus] = useState<SearchStatus>(query.trim() ? 'loading' : 'idle');
  const [results, setResults] = useState<SearchResults>({ videos: [], creators: [] });

  useEffect(() => {
    setInput(query);
    const normalized = query.trim();
    if (!normalized) {
      setResults({ videos: [], creators: [] });
      setStatus('idle');
      return undefined;
    }

    let active = true;
    setStatus('loading');
    void searchPublicRecords(normalized)
      .then((next) => {
        if (!active) return;
        setResults(next);
        setStatus(next.videos.length || next.creators.length ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!active) return;
        setResults({ videos: [], creators: [] });
        setStatus('unavailable');
      });

    return () => {
      active = false;
    };
  }, [query]);

  const submit = () => onSearch(input.trim());

  return (
    <SearchView
      status={status}
      query={query.trim()}
      input={input}
      videos={results.videos}
      creators={results.creators}
      onInputChange={setInput}
      onSubmit={submit}
      onOpenVideo={onOpenVideo}
      onOpenCreator={onOpenCreator}
    />
  );
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
    gap: 32,
  },
  hero: {
    paddingBottom: 30,
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
  searchRow: {
    marginTop: 24,
    width: '100%',
    maxWidth: 760,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
    borderRadius: 9,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.card,
    fontSize: 15,
  },
  searchButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 22,
    borderRadius: 9,
    backgroundColor: theme.colors.signalBlue,
  },
  searchButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stateText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  section: {
    width: '100%',
    gap: 18,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  creatorGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 20,
  },
});