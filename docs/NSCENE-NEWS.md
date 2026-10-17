# NSCENE news feed and chyron

The discovery home now includes a news chyron below the hero and an expandable news feed. The gold NSCENE NEWS label toggles the feed. Headline links open the original source. Cards include source, category, publication time, age, and an older-story label after 24 hours. Category filters and manual refresh are available. The ticker has a pause control and respects reduced-motion preferences; the feed provides stationary access to every story.

Web builds now use `/api/news` by default. This Vercel function reads https://www.nasa.gov/feed/ and returns attributed Space & Science headlines, original NASA URLs and original publication times. The endpoint is cached for five minutes; upstream requests have an eight-second timeout and one-megabyte limit. It never proxies arbitrary URLs or returns article bodies/images. Source reference: https://www.nasa.gov/rss-feeds/ and editorial usage guidance: https://www.nasa.gov/nasa-brand-center/images-and-media/.

Set EXPO_PUBLIC_NEWS_URL at build time to override with an HTTPS JSON endpoint managed by the publisher or NSCENE. Native builds require this explicit deployed HTTPS URL. It must allow cross-origin requests from the site. NASA is the initial connected source, not a general-world-news service. No generated headlines, fabricated breaking badges, or sample current news appear in production.

The endpoint returns an array:

```json
[{"id":"unique-story-id","title":"Publisher headline","source":"Publisher name","url":"https://publisher.example/story","publishedAt":"2026-10-17T06:00:00Z","category":"World"}]
```

This example describes the schema and is not bundled as news. Publish only headlines with permission to syndicate them. The client refreshes every five minutes while mounted, times out after ten seconds, validates attribution/links/dates, sorts newest first and displays up to 30 stories. Refresh failures clear the ticker and show unavailable rather than suggesting old data is live. Production deployment and browser visual/interaction verification remain release gates.
