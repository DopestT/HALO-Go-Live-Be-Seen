import { livePreviewMedia, previewMedia, trendingClipPreviews } from '../src/content/previewMedia';

describe('NSCENE topic video previews', () => {
  it('defines real preview video media for every launch topic', () => {
    expect(previewMedia.map(({ title, category }) => [title, category])).toEqual([
      ['Morning Vibes', 'Just Chatting'],
      ['Acoustic Thursday', 'Music'],
      ['Workout With Me', 'Fitness'],
      ['Game Night', 'Gaming'],
      ['Beach Walk', 'Travel'],
      ['Quick Recipe Hack', 'Food'],
      ['Art Time Lapse', 'Art'],
      ['Behind the Scenes', 'Photography'],
      ['NSCENE Newsroom', 'News'],
    ]);

    for (const item of previewMedia) {
      expect(item.videoUri).toMatch(/^https:\/\/www\.pexels\.com\/download\/video\/\d+\/$/);
      expect(item.sourcePage).toMatch(/^https:\/\/www\.pexels\.com\/video\//);
    }
  });

  it('maps live and trending cards to the intended topic videos', () => {
    expect(livePreviewMedia.map(({ title }) => title)).toEqual([
      'Morning Vibes',
      'Acoustic Thursday',
      'Workout With Me',
      'Game Night',
      'Beach Walk',
    ]);

    expect(trendingClipPreviews.map(({ title, category, media }) => [title, category, media.category])).toEqual([
      ['Sunset in Santorini', 'Travel', 'Travel'],
      ['Guitar Loop', 'Music', 'Music'],
      ['Quick Recipe Hack', 'Food', 'Food'],
      ['Daily Motivation', 'Fitness', 'Fitness'],
      ['Art Time Lapse', 'Art', 'Art'],
      ['Behind the Scenes', 'Photography', 'Photography'],
    ]);
  });
});
