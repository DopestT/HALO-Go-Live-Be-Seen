import React from 'react';
import { AsyncState } from '../src/components/media/AsyncState';
import { VideoPlayer } from '../src/components/media/VideoPlayer';
import { PublicApiError } from '../src/api/publicClient';
import type { VideoWithEngagement } from '../src/api/types';
import {
  loadWatchVideo,
  watchStatusFromError,
  WatchScreenView,
} from '../src/screens/WatchScreen';

const uploaded: VideoWithEngagement = {
  id: 42,
  user_id: 7,
  title: 'Returned upload',
  description: 'Returned description',
  thumbnail_url: '',
  stream_url: 'https://media.example.test/video.m3u8',
  is_live: false,
  is_adult_content: false,
  view_count: 120,
  created_at: '2026-10-16T00:00:00Z',
  updated_at: '2026-10-16T00:00:00Z',
  live_viewers: 0,
  like_count: 9,
  comment_count: 3,
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

describe('WatchScreen', () => {
  it('loads a verified video by route id and rejects invalid ids', async () => {
    const loader = jest.fn().mockResolvedValue(uploaded);
    await expect(loadWatchVideo(42, loader)).resolves.toEqual(uploaded);
    expect(loader).toHaveBeenCalledWith(42);

    await expect(loadWatchVideo(0, loader)).rejects.toMatchObject({ code: 'invalid_request' });
  });

  it('renders uploaded video with only returned metadata', () => {
    const output = WatchScreenView({ status: 'ready', video: uploaded });
    const player = findElement(output, VideoPlayer);
    expect(player).toBeDefined();
    expect((player?.props as { streamUrl: string }).streamUrl).toBe(uploaded.stream_url);
    const text = collectText(output);
    expect(text).toContain('Returned upload');
    expect(text).toContain('Returned description');
    expect(text).toContain('120 views');
    expect(text).toContain('9 likes');
    expect(text).toContain('3 comments');
    expect(text).not.toContain('LIVE');
  });

  it('renders truthful live state and returned live viewers', () => {
    const live = { ...uploaded, is_live: true, live_viewers: 14 };
    const text = collectText(WatchScreenView({ status: 'ready', video: live }));
    expect(text).toContain('LIVE');
    expect(text).toContain('14 watching');
  });

  it('does not construct a player when the backend returns no stream url', () => {
    const output = WatchScreenView({ status: 'no-stream', video: { ...uploaded, stream_url: '' } });
    expect(findElement(output, VideoPlayer)).toBeUndefined();
    const state = findElement(output, AsyncState);
    expect((state?.props as { state: string }).state).toBe('unavailable');
  });

  it('maps 404 separately from unavailable and generic API failures', () => {
    expect(watchStatusFromError(new PublicApiError('not_found', 'missing', 404))).toBe('not-found');
    expect(watchStatusFromError(new PublicApiError('not_configured', 'missing'))).toBe('unavailable');
    expect(watchStatusFromError(new PublicApiError('unavailable', 'down'))).toBe('unavailable');
    expect(watchStatusFromError(new Error('boom'))).toBe('error');
  });
});
