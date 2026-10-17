import { isPublicSection, productIdentity, publicSections } from '../src/product';
import { theme } from '../src/theme';

describe('NSCENE product contract', () => {
  it('uses the approved public identity and domains', () => {
    expect(productIdentity).toEqual({
      name: 'NSCENE',
      tagline: 'See It. Share It. Live It.',
      motto: 'Built to amplify, not manipulate.',
      domain: 'nscene.live',
      secondaryDomain: 'nscene.watch',
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

  it('uses the approved NSCENE semantic colors', () => {
    expect(theme.colors.base).toBe('#030706');
    expect(theme.colors.elevated).toBe('#101613');
    expect(theme.colors.card).toBe('#151B23');
    expect(theme.colors.textPrimary).toBe('#F8FAFC');
    expect(theme.colors.signalBlue).toBe('#FFDA77');
    expect(theme.colors.liveRed).toBe('#FF4D5A');
    expect(theme.colors.success).toBe('#42D392');
  });
});
