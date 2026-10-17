# NSCENE news feed and chyron

The discovery home now includes a news chyron below the hero and an expandable news feed. The gold NSCENE NEWS label toggles the feed. Headline links open the original source. Cards include source, category, publication time, age, and an older-story label after 24 hours. Category filters and manual refresh are available. The ticker has a pause control and respects reduced-motion preferences; the feed provides stationary access to every story.

Set EXPO_PUBLIC_NEWS_URL at build time to an HTTPS JSON endpoint managed by the publisher or NSCENE. It must allow cross-origin requests from the site. No feed URL is configured by this change. No generated headlines, fabricated breaking badges, or sample current news appear in production.

The endpoint returns an array:

```json
[{"id":"unique-story-id","title":"Publisher headline","source":"Publisher name","url":"https://publisher.example/story","publishedAt":"2026-10-17T06:00:00Z","category":"World"}]
```

This example describes the schema and is not bundled as news. Publish only headlines with permission to syndicate them. The client refreshes every five minutes while mounted, times out after ten seconds, validates attribution/links/dates, sorts newest first and displays up to 30 stories. Refresh failures clear the ticker and show unavailable rather than suggesting old data is live. Connecting an actual publisher feed and browser visual/interaction verification remain open gates.
