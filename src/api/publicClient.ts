import type {
  PaginationOptions,
  PublicCreator,
  VideoListOptions,
  VideoWithEngagement,
} from './types';

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

type BackendErrorPayload = {
  error?: unknown;
  message?: unknown;
};

export class PublicApiError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = 'PublicApiError';
    this.code = code;
    this.status = status;
  }
}

const normalizeApiBaseUrl = (value: string): string => value.trim().replace(/\/+$/, '');

const getApiBaseUrl = (): string => {
  const baseUrl = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? '');
  if (!baseUrl) {
    throw new PublicApiError(
      'not_configured',
      'Public NSCENE data is not configured for this deployment.',
    );
  }
  return baseUrl;
};

const positiveId = (value: number, label: string): number => {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new PublicApiError('invalid_request', `Invalid ${label}.`);
  }
  return value;
};

const pagination = (options: PaginationOptions): Required<PaginationOptions> => {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new PublicApiError('invalid_request', 'Limit must be between 1 and 100.');
  }
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new PublicApiError('invalid_request', 'Offset must be zero or greater.');
  }
  return { limit, offset };
};

const queryString = (entries: Array<[string, string | number | boolean | undefined]>): string => {
  const parts = entries
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

const readErrorPayload = async (response: Response): Promise<BackendErrorPayload> => {
  try {
    return await response.json() as BackendErrorPayload;
  } catch {
    return {};
  }
};

const requestJson = async (path: string): Promise<unknown> => {
  const baseUrl = getApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { method: 'GET' });
  } catch {
    throw new PublicApiError('unavailable', 'NSCENE data is temporarily unavailable.');
  }

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    const code = typeof payload.error === 'string'
      ? payload.error
      : response.status === 404
        ? 'not_found'
        : 'request_failed';
    const message = typeof payload.message === 'string'
      ? payload.message
      : response.status === 404
        ? 'The requested NSCENE record was not found.'
        : 'Unable to load NSCENE data.';
    throw new PublicApiError(code, message, response.status);
  }

  try {
    return await response.json() as unknown;
  } catch {
    throw new PublicApiError('invalid_response', 'NSCENE returned an unreadable response.');
  }
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isVideo = (value: unknown): value is VideoWithEngagement => {
  if (!value || typeof value !== 'object') return false;
  const video = value as Record<string, unknown>;
  return (
    isFiniteNumber(video.id) &&
    isFiniteNumber(video.user_id) &&
    isString(video.title) &&
    isString(video.description) &&
    isString(video.thumbnail_url) &&
    isString(video.stream_url) &&
    isBoolean(video.is_live) &&
    isBoolean(video.is_adult_content) &&
    isFiniteNumber(video.view_count) &&
    isString(video.created_at) &&
    isString(video.updated_at) &&
    isFiniteNumber(video.live_viewers) &&
    isFiniteNumber(video.like_count) &&
    isFiniteNumber(video.comment_count)
  );
};

const isCreator = (value: unknown): value is PublicCreator => {
  if (!value || typeof value !== 'object') return false;
  const creator = value as Record<string, unknown>;
  return (
    isFiniteNumber(creator.id) &&
    isString(creator.username) &&
    isString(creator.display_name) &&
    isString(creator.bio) &&
    isString(creator.avatar_url)
  );
};

const parseOne = <T>(payload: unknown, validator: (value: unknown) => value is T): T => {
  if (!validator(payload)) {
    throw new PublicApiError('invalid_response', 'NSCENE returned an unexpected response shape.');
  }
  return payload;
};

const parseList = <T>(payload: unknown, validator: (value: unknown) => value is T): T[] => {
  if (!Array.isArray(payload) || !payload.every(validator)) {
    throw new PublicApiError('invalid_response', 'NSCENE returned an unexpected response shape.');
  }
  return payload;
};

export const listVideos = async (options: VideoListOptions = {}): Promise<VideoWithEngagement[]> => {
  const { limit, offset } = pagination(options);
  const query = queryString([
    ['live', options.live],
    ['limit', limit],
    ['offset', offset],
  ]);
  return parseList(await requestJson(`/api/v1/videos${query}`), isVideo);
};

export const getVideo = async (id: number): Promise<VideoWithEngagement> => {
  positiveId(id, 'video ID');
  return parseOne(await requestJson(`/api/v1/videos/${id}`), isVideo);
};

export const listUserVideos = async (
  userId: number,
  options: PaginationOptions = {},
): Promise<VideoWithEngagement[]> => {
  positiveId(userId, 'creator ID');
  const { limit, offset } = pagination(options);
  const query = queryString([
    ['limit', limit],
    ['offset', offset],
  ]);
  return parseList(await requestJson(`/api/v1/users/${userId}/videos${query}`), isVideo);
};

export const listCreators = async (options: PaginationOptions = {}): Promise<PublicCreator[]> => {
  const { limit, offset } = pagination(options);
  const query = queryString([
    ['limit', limit],
    ['offset', offset],
  ]);
  return parseList(await requestJson(`/api/v1/creators${query}`), isCreator);
};

export const getCreator = async (id: number): Promise<PublicCreator> => {
  positiveId(id, 'creator ID');
  return parseOne(await requestJson(`/api/v1/creators/${id}`), isCreator);
};
