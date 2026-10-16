import React from 'react';
import { MediaCard } from '../src/components/media/MediaCard';
import type { VideoWithEngagement } from '../src/api/types';

const video: VideoWithEngagement = {
  id: 42,
  user_id: 7,
  title: 'Verified video title',
  description: 'Verified description',
  thumbnail_url: '',
  stream_url: 'https://media.example.test/video.m3u8',
  is_live: true,
  is_adult_content: false,
  view_count: 120,
  created_at: '2026-10-16T00:00:00Z',
  updated_at: '2026-10-16T00:00:00Z',
  live_viewers: 14,
  like_count: 9,
  comment_count: 3,
};

const collectText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (React.isValidElement(node)) {
    return collectText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
};

describe('MediaCard', () => {
  it('renders only verified media fields and truthful LIVE state', () => {
    const output = MediaCard({ video, onOpen: jest.fn() });
    const text = collectText(output);

    expect(text).toContain('LIVE');
    expect(text).toContain('Verified video title');
    expect(text).toContain('Creator #7');
    expect(text).toContain('120 views');
    expect(text).toContain('14 watching');
    expect(text).toContain('9 likes');
    expect(text).toContain('3 comments');
    expect(text).not.toMatch(/followers/i);
    expect(text).not.toMatch(/verified creator/i);
  });

  it('does not label uploaded video as live and opens the returned video id', () => {
    const onOpen = jest.fn();
    const uploaded = { ...video, is_live: false, live_viewers: 0 };
    const output = MediaCard({ video: uploaded, onOpen });
    const props = output.props as {
      accessibilityLabel?: string;
      onPress?: () => void;
    };

    expect(collectText(output)).not.toContain('LIVE');
    expect(props.accessibilityLabel).toBe('Open Verified video title');
    props.onPress?.();
    expect(onOpen).toHaveBeenCalledWith(42);
  });
});
