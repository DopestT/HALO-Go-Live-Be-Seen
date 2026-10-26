import React from 'react';
import { CreatorCard } from '../src/components/creator/CreatorCard';
import { MediaGrid } from '../src/components/media/MediaGrid';
import type {
  PaginationOptions,
  PublicCreator,
  VideoListOptions,
  VideoWithEngagement,
} from '../src/api/types';
import {
  SearchView,
  searchPublicRecords,
} from '../src/screens/SearchScreen';

const climateVideo: VideoWithEngagement = {
  id: 42,
  user_id: 7,
  title: 'Climate Live',
  description: 'A verified climate conversation.',
  thumbnail_url: '',
  stream_url: 'https://media.example.test/climate.m3u8',
  is_live: true,
  is_adult_content: false,
  view_count: 120,
  created_at: '2026-10-25T12:00:00Z',
  updated_at: '2026-10-25T12:00:00Z',
  live_viewers: 12,
  like_count: 9,
  comment_count: 3,
};

const unrelatedVideo: VideoWithEngagement = {
  ...climateVideo,
  id: 43,
  title: 'Cooking Tonight',
  description: 'Dinner from a connected creator.',
  is_live: false,
};

const climateCreator: PublicCreator = {
  id: 7,
  username: 'climatecreator',
  display_name: 'Climate Creator',
  bio: 'Reporting on climate and cities.',
  avatar_url: '',
};

type VideoLoader = (options: VideoListOptions) => Promise<VideoWithEngagement[]>;
type CreatorLoader = (options: PaginationOptions) => Promise<PublicCreator[]>;

const findElement = (node: React.ReactNode, type: unknown): React.ReactElement | undefined => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, type);
      if (found) return found;
    }
    return undefined;
  }
  if (!React.isValidElement(node)) return undefined;
  if (node.type === type) return node;
  return findElement((node.props as { children?: React.ReactNode }).children, type);
};

const collectText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  if (!React.isValidElement(node)) return '';
  return collectText((node.props as { children?: React.ReactNode }).children);
};

describe('NSCENE public search', () => {
  it('keeps blank search idle and does not call or invent backend results', async () => {
    const videoLoader = jest.fn<ReturnType<VideoLoader>, Parameters<VideoLoader>>();
    const creatorLoader = jest.fn<ReturnType<CreatorLoader>, Parameters<CreatorLoader>>();

    await expect(searchPublicRecords('   ', videoLoader, creatorLoader)).resolves.toEqual({
      videos: [],
      creators: [],
    });
    expect(videoLoader).not.toHaveBeenCalled();
    expect(creatorLoader).not.toHaveBeenCalled();
  });

  it('searches bounded real records, filters case-insensitively, and deduplicates videos', async () => {
    const videoLoader = jest.fn<ReturnType<VideoLoader>, Parameters<VideoLoader>>(
      async (options) => options.live
        ? [climateVideo]
        : [climateVideo, unrelatedVideo],
    );
    const creatorLoader = jest.fn<ReturnType<CreatorLoader>, Parameters<CreatorLoader>>(
      async () => [climateCreator],
    );

    await expect(searchPublicRecords('CLIMATE', videoLoader, creatorLoader)).resolves.toEqual({
      videos: [climateVideo],
      creators: [climateCreator],
    });
    expect(videoLoader).toHaveBeenNthCalledWith(1, { live: true, limit: 50, offset: 0 });
    expect(videoLoader).toHaveBeenNthCalledWith(2, { live: false, limit: 50, offset: 0 });
    expect(creatorLoader).toHaveBeenCalledWith({ limit: 50, offset: 0 });
  });

  it('renders real returned media and creator cards and preserves their IDs', () => {
    const onOpenVideo = jest.fn();
    const onOpenCreator = jest.fn();
    const output = SearchView({
      status: 'ready',
      query: 'climate',
      input: 'climate',
      videos: [climateVideo],
      creators: [climateCreator],
      onInputChange: jest.fn(),
      onSubmit: jest.fn(),
      onOpenVideo,
      onOpenCreator,
    });
    const media = findElement(output, MediaGrid);
    const creator = findElement(output, CreatorCard);
    expect((media?.props as { videos: VideoWithEngagement[] }).videos).toEqual([climateVideo]);
    expect((creator?.props as { creator: PublicCreator }).creator).toEqual(climateCreator);
    (media?.props as { onOpen: (id: number) => void }).onOpen(42);
    (creator?.props as { onOpen: (id: number) => void }).onOpen(7);
    expect(onOpenVideo).toHaveBeenCalledWith(42);
    expect(onOpenCreator).toHaveBeenCalledWith(7);
  });

  it('renders honest idle, empty, and unavailable states without fallback content', () => {
    const base = {
      input: '',
      videos: [],
      creators: [],
      onInputChange: jest.fn(),
      onSubmit: jest.fn(),
      onOpenVideo: jest.fn(),
      onOpenCreator: jest.fn(),
    };
    expect(collectText(SearchView({ ...base, status: 'idle', query: '' }))).toContain(
      'Search videos and creators on NSCENE.',
    );
    expect(collectText(SearchView({ ...base, status: 'empty', query: 'quantum' }))).toContain(
      'No verified results for “quantum”.',
    );
    expect(collectText(SearchView({ ...base, status: 'unavailable', query: 'climate' }))).toContain(
      'Search is unavailable right now.',
    );
  });
});