const { parseFeed, fetchNews, FEED_URL } = require('../server/news');
const xml = (link='https://www.nasa.gov/news/example/', date='Fri, 16 Oct 2026 12:00:00 GMT') => `<rss><channel><item><title><![CDATA[Space & science]]></title><link>${link}</link><pubDate>${date}</pubDate></item></channel></rss>`;
const now = Date.parse('2026-10-17T00:00:00Z');
it('preserves publisher headline, attribution, URL and publication date', () => {
  expect(parseFeed(xml(), now)[0]).toEqual({ id: 'https://www.nasa.gov/news/example/', title: 'Space & science', source: 'NASA', url: 'https://www.nasa.gov/news/example/', publishedAt: '2026-10-16T12:00:00.000Z', category: 'Space & Science' });
});
it('rejects malformed XML and DTDs', () => {
  expect(() => parseFeed('<rss>', now)).toThrow();
  expect(() => parseFeed('<!DOCTYPE rss>'+xml(), now)).toThrow();
});
it('omits off-domain links, unsafe protocols and invalid/future timestamps', () => {
  for (const link of ['https://nasa.gov.evil.test/story','javascript:alert(1)','http://nasa.gov/story']) expect(parseFeed(xml(link), now)).toEqual([]);
  expect(parseFeed(xml(undefined, 'invalid'), now)).toEqual([]);
  expect(parseFeed(xml(undefined, 'Fri, 16 Oct 2027 12:00:00 GMT'), now)).toEqual([]);
});
it('fetches only the fixed publisher feed and disables redirects', async () => {
  const bytes = Buffer.from(xml());
  const reader = { read: jest.fn().mockResolvedValueOnce({done:false,value:bytes}).mockResolvedValueOnce({done:true}), releaseLock: jest.fn() };
  const fetcher = jest.fn().mockResolvedValue({ok:true,body:{getReader:()=>reader}});
  await expect(fetchNews(fetcher)).resolves.toHaveLength(1);
  expect(fetcher.mock.calls[0][0]).toBe(FEED_URL);
  expect(fetcher.mock.calls[0][1].redirect).toBe('error');
});
it('fails on upstream errors', async () => {
  await expect(fetchNews(jest.fn().mockResolvedValue({ok:false}))).rejects.toThrow();
});
