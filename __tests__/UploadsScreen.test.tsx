import React from 'react';
import { AsyncState } from '../src/components/media/AsyncState';
import { MediaGrid } from '../src/components/media/MediaGrid';
import type { VideoWithEngagement } from '../src/api/types';
import { loadUploads, UploadsView } from '../src/screens/UploadsScreen';

const video: VideoWithEngagement = {
  id: 84,
  user_id: 9,
  title: 'Returned upload title',
  description: 'Returned upload description',
  thumbnail_url: '',
  stream_url: 'https://media.example.test/upload.m3u8',
  is_live: false,
  is_adult_content: false,
  view_count: 33,
  created_at: '2026-10-16T00:00:00Z',
  updated_at: '2026-10-16T00:00:00Z',
  live_viewers: 0,
  like_count: 5,
  comment_count: 2,
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

describe('UploadsScreen', () => {
  it('loads only verified non-live records', async () => {
    const loader = jest.fn().mockResolvedValue([video]);
    await expect(loadUploads(loader)).resolves.toEqual([video]);
    expect(loader).toHaveBeenCalledWith({ live: false });
  });

  it.each([
    ['loading', 'loading'],
    ['empty', 'empty'],
    ['unavailable', 'unavailable'],
    ['error', 'error'],
  ] as const)('renders the %s state honestly', (status, expectedState) => {
    const output = UploadsView({ status, videos: [], onOpen: jest.fn() });
    const state = findElement(output, AsyncState);
    expect(state).toBeDefined();
    expect((state?.props as { state: string }).state).toBe(expectedState);
  });

  it('renders returned uploads and navigates by returned video id', () => {
    const onOpen = jest.fn();
    const output = UploadsView({ status: 'ready', videos: [video], onOpen });
    const grid = findElement(output, MediaGrid);
    expect(grid).toBeDefined();
    expect((grid?.props as { videos: VideoWithEngagement[] }).videos).toEqual([video]);
    (grid?.props as { onOpen: (id: number) => void }).onOpen(84);
    expect(onOpen).toHaveBeenCalledWith(84);
  });
});
