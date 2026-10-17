export type NewsItem = { id: string; title: string; source: string; url: string; publishedAt: string; category: string };
declare const process: { env: { EXPO_PUBLIC_NEWS_URL?: string } };

export function parseNews(payload: unknown, now = Date.now()): NewsItem[] {
  if (!Array.isArray(payload)) throw new Error('News response must be an array');
  const seen = new Set<string>();
  return payload.map((value): NewsItem => {
    if (!value || typeof value !== 'object') throw new Error('Invalid news item');
    const item = value as Record<string, unknown>;
    for (const field of ['id', 'title', 'source', 'url', 'publishedAt', 'category']) {
      if (typeof item[field] !== 'string' || !(item[field] as string).trim()) throw new Error(`Missing ${field}`);
    }
    if (!/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(item.url as string)) throw new Error('News links must use HTTPS');
    const published = Date.parse(item.publishedAt as string);
    if (!Number.isFinite(published) || published > now + 60000) throw new Error('Invalid publication time');
    if (seen.has(item.id as string)) throw new Error('Duplicate news ID');
    seen.add(item.id as string);
    return item as NewsItem;
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 30);
}

export async function loadNews(signal: AbortSignal): Promise<NewsItem[]> {
  const endpoint = process.env.EXPO_PUBLIC_NEWS_URL?.trim();
  if (!endpoint) return []; // No publisher connected: never manufacture headlines.
  if (!endpoint.startsWith('https://')) throw new Error('News endpoint must use HTTPS');
  const response = await fetch(endpoint, { signal });
  if (!response.ok) throw new Error('News feed unavailable');
  return parseNews(await response.json());
}

export function newsAge(publishedAt: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(publishedAt)) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}
