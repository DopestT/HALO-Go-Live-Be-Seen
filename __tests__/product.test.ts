import { isPublicSection, productIdentity, publicSections } from '../src/product';

describe('NSCENE product contract', () => {
  it('uses the approved public identity copy', () => {
    expect(productIdentity).toEqual({
      name: 'NSCENE',
      tagline: 'See It. Share It. Live It.',
      motto: 'Built to amplify, not manipulate.',
      domain: 'nscene.watch',
    });
  });

  it('keeps the six public destinations in canonical order', () => {
    expect(publicSections.map((section) => section.label)).toEqual([
      'LIVE',
      'UPLOADS',
      'CLIPS',
      'SHOWS',
      'CREATORS',
      'COMMUNITIES',
    ]);

    expect(publicSections.map((section) => section.id)).toEqual([
      'live',
      'uploads',
      'clips',
      'shows',
      'creators',
      'communities',
    ]);
  });

  it('does not expose Studio or Go Live as public destinations', () => {
    const labels = publicSections.map((section) => section.label);
    expect(labels).not.toContain('STUDIO');
    expect(labels).not.toContain('GO LIVE');
  });

  it('validates only canonical public section ids', () => {
    expect(isPublicSection('live')).toBe(true);
    expect(isPublicSection('communities')).toBe(true);
    expect(isPublicSection('studio')).toBe(false);
    expect(isPublicSection('account')).toBe(false);
    expect(isPublicSection('anything-else')).toBe(false);
  });
});
