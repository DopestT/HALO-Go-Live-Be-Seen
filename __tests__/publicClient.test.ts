import {
  getCreator,
  getVideo,
  listCreators,
  listUserVideos,
  listVideos,
  PublicApiError,
} from '../src/api/publicClient';

const validVideo = {
  id: 42,
  user_id: 7,
  title: 'Verified title',
  description: 'Verified description',
  thumbnail_url: 'https://media.example.test/thumb.jpg',
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

const validCreator = {
  id: 7,
  username: 'creator7',
  display_name: 'Creator Seven',
  bio: 'Public bio',
  avatar_url: 'https://media.example.test/avatar.jpg',
};

const response = (status: number, payload: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(payload),
});

describe('NSCENE public API client', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/';
  });

  afterEach(() => {
    delete (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.EXPO_PUBLIC_API_URL;
  });

  it('encodes list video filters without a hard-coded API host', async () => {
    fetchMock.mockResolvedValue(response(200, [validVideo]));

    await expect(listVideos({ live: true, limit: 12, offset: 24 })).resolves.toEqual([validVideo]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/videos?live=true&limit=12&offset=24',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('gets one video and maps 404 to a typed public API error', async () => {
    fetchMock.mockResolvedValueOnce(response(200, validVideo));
    await expect(getVideo(42)).resolves.toEqual(validVideo);

    fetchMock.mockResolvedValueOnce(response(404, { error: 'not_found', message: 'Video not found' }));
    await expect(getVideo(99)).rejects.toMatchObject<Partial<PublicApiError>>({
      name: 'PublicApiError',
      status: 404,
      code: 'not_found',
    });
  });

  it('lists one user’s videos with bounded pagination', async () => {
    fetchMock.mockResolvedValue(response(200, [validVideo]));
    await listUserVideos(7, { limit: 5, offset: 10 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/users/7/videos?limit=5&offset=10',
      expect.any(Object),
    );
  });

  it('rejects malformed video payloads instead of fabricating records', async () => {
    fetchMock.mockResolvedValue(response(200, [{ ...validVideo, id: 'not-a-number' }]));
    await expect(listVideos({ live: true })).rejects.toMatchObject({
      name: 'PublicApiError',
      code: 'invalid_response',
    });
  });

  it('fails clearly when the deployment has no API base URL', async () => {
    delete (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.EXPO_PUBLIC_API_URL;
    await expect(listVideos()).rejects.toMatchObject({
      name: 'PublicApiError',
      code: 'not_configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('has typed creator reads ready for the public creator API', async () => {
    fetchMock.mockResolvedValueOnce(response(200, [validCreator]));
    await expect(listCreators({ limit: 10, offset: 0 })).resolves.toEqual([validCreator]);
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://api.example.test/api/v1/creators?limit=10&offset=0',
      expect.any(Object),
    );

    fetchMock.mockResolvedValueOnce(response(200, validCreator));
    await expect(getCreator(7)).resolves.toEqual(validCreator);
  });
});
