import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
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

describe('MediaCard', () => {
  it('renders only verified media fields and truthful LIVE state', () => {
    const { getByText, queryByText } = render(<MediaCard video={video} onOpen={jest.fn()} />);

    getByText('LIVE');
    getByText('Verified video title');
    getByText('Creator #7');
    getByText('120 views');
    getByText('14 watching');
    getByText('9 likes');
    getByText('3 comments');
    expect(queryByText(/followers/i)).toBeNull();
    expect(queryByText(/verified creator/i)).toBeNull();
  });

  it('does not label uploaded video as live and opens the returned video id', () => {
    const onOpen = jest.fn();
    const uploaded = { ...video, is_live: false, live_viewers: 0 };
    const { getByLabelText, queryByText } = render(<MediaCard video={uploaded} onOpen={onOpen} />);

    expect(queryByText('LIVE')).toBeNull();
    fireEvent.press(getByLabelText('Open Verified video title'));
    expect(onOpen).toHaveBeenCalledWith(42);
  });
});
