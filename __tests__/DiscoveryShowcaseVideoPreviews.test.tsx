import { previewMedia } from '../src/content/previewMedia';

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
});
