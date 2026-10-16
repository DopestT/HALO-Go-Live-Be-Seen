import React from 'react';
import { AsyncState } from '../src/components/media/AsyncState';
import { MediaGrid } from '../src/components/media/MediaGrid';
import { PublicApiError } from '../src/api/publicClient';
import type { VideoWithEngagement } from '../src/api/types';
import {
  DiscoveryFeedView,
  laneStatusFromError,
  loadLiveVideos,
} from '../src/screens/DiscoveryFeed';

const video: VideoWithEngagement = {
  id: 42,
  user_id: 7,
  title: 'Returned live title',
  description: 'Returned description',
  thumbnail_url: '',
  stream_url: 'https://media.example.test/live.m3u8',
  is_live: true,
  is_adult_content: false,
  view_count: 12,
  created_at: '2026-10-16T00:00:00Z',
  updated_at: '2026-10-16T00:00:00Z',
  live_viewers: 4,
  like_count: 2,
  comment_count: 1,
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

describe('DiscoveryFeed', () => {
  it('loads only verified live records', async () => {
    const loader = jest.fn().mockResolvedValue([video]);
    await expect(loadLiveVideos(loader)).resolves.toEqual([video]);
    expect(loader).toHaveBeenCalledWith({ live: true });
  });

  it.each([
    ['loading', 'loading'],
    ['empty', 'empty'],
    ['unavailable', 'unavailable'],
    ['error', 'error'],
  ] as const)('renders the %s state honestly', (status, expectedState) => {
    const output = DiscoveryFeedView({ status, videos: [], onOpen: jest.fn() });
    const state = findElement(output, AsyncState);
    expect(state).toBeDefined();
    expect((state?.props as { state: string }).state).toBe(expectedState);
  });

  it('renders returned records and navigates by returned video id', () => {
    const onOpen = jest.fn();
    const output = DiscoveryFeedView({ status: 'ready', videos: [video], onOpen });
    const grid = findElement(output, MediaGrid);
    expect(grid).toBeDefined();
    expect((grid?.props as { videos: VideoWithEngagement[] }).videos).toEqual([video]);
    (grid?.props as { onOpen: (id: number) => void }).onOpen(42);
    expect(onOpen).toHaveBeenCalledWith(42);
  });

  it('maps API configuration/network failures to unavailable and other failures to error', () => {
    expect(laneStatusFromError(new PublicApiError('not_configured', 'missing'))).toBe('unavailable');
    expect(laneStatusFromError(new PublicApiError('unavailable', 'down'))).toBe('unavailable');
    expect(laneStatusFromError(new Error('boom'))).toBe('error');
  });
});
