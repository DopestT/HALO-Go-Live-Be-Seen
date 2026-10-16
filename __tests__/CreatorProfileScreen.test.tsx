import React from 'react';
import { AsyncState } from '../src/components/media/AsyncState';
import { MediaGrid } from '../src/components/media/MediaGrid';
import { PublicApiError } from '../src/api/publicClient';
import type { PublicCreator, VideoWithEngagement } from '../src/api/types';
import {
  CreatorProfileView,
  creatorProfileStatusFromError,
  loadCreatorProfile,
} from '../src/screens/CreatorProfileScreen';

const creator: PublicCreator = {
  id: 7,
  username: 'creator7',
  display_name: 'Creator Seven',
  bio: 'Returned public bio',
  avatar_url: '',
};

const video: VideoWithEngagement = {
  id: 42,
  user_id: 7,
  title: 'Creator upload',
  description: '',
  thumbnail_url: '',
  stream_url: 'https://media.example.test/video.m3u8',
  is_live: false,
  is_adult_content: false,
  view_count: 4,
  created_at: '2026-10-16T00:00:00Z',
  updated_at: '2026-10-16T00:00:00Z',
  live_viewers: 0,
  like_count: 1,
  comment_count: 0,
};

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
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (React.isValidElement(node)) return collectText((node.props as { children?: React.ReactNode }).children);
  return '';
};

describe('CreatorProfileScreen', () => {
  it('loads public profile and uploads together', async () => {
    const creatorLoader = jest.fn().mockResolvedValue(creator);
    const videoLoader = jest.fn().mockResolvedValue([video]);
    await expect(loadCreatorProfile(7, creatorLoader, videoLoader)).resolves.toEqual({ creator, videos: [video] });
    expect(creatorLoader).toHaveBeenCalledWith(7);
    expect(videoLoader).toHaveBeenCalledWith(7, { limit: 40, offset: 0 });
  });

  it('renders returned profile and uploads without invented social metrics', () => {
    const output = CreatorProfileView({ status: 'ready', creator, videos: [video], onOpenVideo: jest.fn() });
    const text = collectText(output);
    expect(text).toContain('Creator Seven');
    expect(text).toContain('@creator7');
    expect(text).toContain('Returned public bio');
    expect(text).not.toMatch(/followers/i);
    expect(text).not.toMatch(/verified/i);
    const grid = findElement(output, MediaGrid);
    expect((grid?.props as { videos: VideoWithEngagement[] }).videos).toEqual([video]);
  });

  it('renders an honest empty uploads state for a real creator with no videos returned', () => {
    const output = CreatorProfileView({ status: 'ready', creator, videos: [], onOpenVideo: jest.fn() });
    const state = findElement(output, AsyncState);
    expect((state?.props as { state: string }).state).toBe('empty');
  });

  it('maps creator 404 and API failures distinctly', () => {
    expect(creatorProfileStatusFromError(new PublicApiError('not_found', 'missing', 404))).toBe('not-found');
    expect(creatorProfileStatusFromError(new PublicApiError('unavailable', 'down'))).toBe('unavailable');
    expect(creatorProfileStatusFromError(new Error('boom'))).toBe('error');
  });
});
