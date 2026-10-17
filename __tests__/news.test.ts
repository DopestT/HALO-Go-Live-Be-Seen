import { parseNews, newsAge } from '../src/api/news';
const now = Date.parse('2026-10-17T06:00:00Z');
const item = { id: '1', title: 'Test headline', source: 'Test publisher', url: 'https://example.com/story', publishedAt: '2026-10-17T05:00:00Z', category: 'World' };
it('keeps source attribution and sorts stories newest first', () => {
  expect(parseNews([item, { ...item, id: '2', publishedAt: '2026-10-17T05:30:00Z' }], now).map(x => x.id)).toEqual(['2', '1']);
});
it.each([{ ...item, url: 'javascript:alert(1)' }, { ...item, source: '' }, { ...item, publishedAt: 'invalid' }, { ...item, publishedAt: '2027-01-01T00:00:00Z' }])('rejects unsafe, unattributed or incorrectly dated stories', invalid => {
  expect(() => parseNews([invalid], now)).toThrow();
});
it('rejects duplicate story IDs and invalid payloads', () => {
  expect(() => parseNews([item, item], now)).toThrow();
  expect(() => parseNews({}, now)).toThrow();
  expect(parseNews([], now)).toEqual([]);
});
it('shows age without presenting old stories as fresh', () => {
  expect(newsAge(item.publishedAt, now)).toBe('1h ago');
  expect(newsAge('2026-10-14T06:00:00Z', now)).toBe('3d ago');
});
