const { XMLParser, XMLValidator } = require('fast-xml-parser');
const FEED_URL = 'https://www.nasa.gov/feed/';
const LIMIT = 1024 * 1024;

function parseFeed(xml, now = Date.now()) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw new Error('Invalid feed XML');
  const parsed = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true }).parse(xml);
  if (!parsed.rss?.channel) throw new Error('Missing RSS channel');
  const raw = parsed.rss.channel.item || [];
  const items = Array.isArray(raw) ? raw : [raw];
  const seen = new Set();
  return items.flatMap(item => {
    if (typeof item.title !== 'string' || !item.title.trim() || typeof item.link !== 'string') return [];
    let url;
    try { url = new URL(item.link); } catch { return []; }
    if (url.protocol !== 'https:' || !(url.hostname === 'nasa.gov' || url.hostname.endsWith('.nasa.gov')) || url.username || url.password) return [];
    const published = Date.parse(item.pubDate);
    if (!Number.isFinite(published) || published > now + 60000 || seen.has(url.href)) return [];
    seen.add(url.href);
    return [{ id: url.href, title: item.title, source: 'NASA', url: url.href, publishedAt: new Date(published).toISOString(), category: 'Space & Science' }];
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 30);
}

async function fetchNews(fetcher = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetcher(FEED_URL, {
      signal: controller.signal, redirect: 'error',
      headers: { Accept: 'application/rss+xml, application/xml, text/xml', 'User-Agent': 'NSCENE-News/1.0 (headline reader; https://github.com/DopestT/HALO-Go-Live-Be-Seen)' },
    });
    if (!response.ok || !response.body) throw new Error('Upstream unavailable');
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > LIMIT) { await reader.cancel(); throw new Error('Feed too large'); }
        chunks.push(Buffer.from(value));
      }
    } finally { reader.releaseLock(); }
    return parseFeed(Buffer.concat(chunks).toString('utf8'));
  } finally { clearTimeout(timer); }
}
module.exports = { parseFeed, fetchNews, FEED_URL };
