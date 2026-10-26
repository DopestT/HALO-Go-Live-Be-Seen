import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { listCreators, listVideos } from '../src/api/publicClient';
import type { PublicCreator, VideoWithEngagement } from '../src/api/types';
import { SearchScreen } from '../src/screens/SearchScreen';

jest.mock('../src/api/publicClient', () => ({
  listVideos: jest.fn(),
  listCreators: jest.fn(),
}));

const mockListVideos = listVideos as jest.MockedFunction<typeof listVideos>;
const mockListCreators = listCreators as jest.MockedFunction<typeof listCreators>;

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

const renderSearch = (query: string, overrides: Partial<React.ComponentProps<typeof SearchScreen>> = {}) => {
  const props: React.ComponentProps<typeof SearchScreen> = {
    query,
    onSearch: jest.fn(),
    onOpenVideo: jest.fn(),
    onOpenCreator: jest.fn(),
    ...overrides,
  };
  return { ...render(<SearchScreen {...props} />), props };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NSCENE public search', () => {
  it('keeps blank search idle and does not invent suggestions or call the backend', () => {
    renderSearch('');
    expect(screen.getByText('Search videos and creators on NSCENE.')).toBeTruthy();
    expect(mockListVideos).not.toHaveBeenCalled();
    expect(mockListCreators).not.toHaveBeenCalled();
  });

  it('searches bounded real video and creator records, deduplicates videos, and opens returned IDs', async () => {
    mockListVideos
      .mockResolvedValueOnce([climateVideo])
      .mockResolvedValueOnce([climateVideo, unrelatedVideo]);
    mockListCreators.mockResolvedValueOnce([climateCreator]);
    const onOpenVideo = jest.fn();
    const onOpenCreator = jest.fn();
    renderSearch('climate', { onOpenVideo, onOpenCreator });

    await screen.findByText('Climate Live');
    expect(screen.getAllByText('Climate Live')).toHaveLength(1);
    expect(screen.getByText('Climate Creator')).toBeTruthy();
    expect(screen.queryByText('Cooking Tonight')).toBeNull();
    expect(mockListVideos).toHaveBeenNthCalledWith(1, { live: true, limit: 50, offset: 0 });
    expect(mockListVideos).toHaveBeenNthCalledWith(2, { live: false, limit: 50, offset: 0 });
    expect(mockListCreators).toHaveBeenCalledWith({ limit: 50, offset: 0 });

    fireEvent.press(screen.getByLabelText('Open Climate Live'));
    fireEvent.press(screen.getByLabelText('Open creator Climate Creator'));
    expect(onOpenVideo).toHaveBeenCalledWith(42);
    expect(onOpenCreator).toHaveBeenCalledWith(7);
  });

  it('shows an honest no-results state for a completed search', async () => {
    mockListVideos.mockResolvedValue([unrelatedVideo]);
    mockListCreators.mockResolvedValue([]);
    renderSearch('quantum');
    await screen.findByText('No verified results for “quantum”.');
  });

  it('shows an unavailable state instead of fallback content when the backend fails', async () => {
    mockListVideos.mockRejectedValue(new Error('down'));
    mockListCreators.mockResolvedValue([]);
    renderSearch('climate');
    await screen.findByText('Search is unavailable right now.');
    expect(screen.queryByText('Climate Live')).toBeNull();
  });

  it('submits trimmed input through navigation and waits for the URL-backed query before searching', async () => {
    const onSearch = jest.fn();
    renderSearch('', { onSearch });
    fireEvent.changeText(screen.getByLabelText('Search NSCENE'), '  climate  ');
    fireEvent.press(screen.getByText('Search'));
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith('climate'));
    expect(mockListVideos).not.toHaveBeenCalled();
    expect(mockListCreators).not.toHaveBeenCalled();
  });
});