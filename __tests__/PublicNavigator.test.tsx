import { parsePublicPath, routePath } from '../src/navigation/PublicNavigator';

describe('NSCENE browser routing', () => {
  it.each([
    ['/live', 'live'],
    ['/uploads', 'uploads'],
    ['/clips', 'clips'],
    ['/shows', 'shows'],
    ['/creators', 'creators'],
    ['/communities', 'communities'],
  ] as const)('parses %s as the %s public lane', (path, section) => {
    expect(parsePublicPath(path)).toEqual({ kind: 'section', section });
  });

  it('parses watch and creator detail ids', () => {
    expect(parsePublicPath('/watch/42')).toEqual({ kind: 'watch', id: 42 });
    expect(parsePublicPath('/creator/7')).toEqual({ kind: 'creator', id: 7 });
  });

  it('keeps protected surfaces addressable but distinct from public lanes', () => {
    expect(parsePublicPath('/studio')).toEqual({ kind: 'protected', section: 'studio' });
    expect(parsePublicPath('/account')).toEqual({ kind: 'protected', section: 'account' });
    expect(parsePublicPath('/signin')).toEqual({ kind: 'protected', section: 'signin' });
  });

  it('parses search as a public utility without making it a content lane', () => {
    expect(parsePublicPath('/search?q=hello%20world')).toEqual({
      kind: 'search',
      query: 'hello world',
    });
    expect(parsePublicPath('/search')).toEqual({ kind: 'search', query: '' });
    expect(parsePublicPath('/search?q=creator%2Bnews')).toEqual({
      kind: 'search',
      query: 'creator+news',
    });
  });

  it('falls back safely for unknown or invalid paths', () => {
    expect(parsePublicPath('/watch/not-a-number')).toEqual({ kind: 'not-found' });
    expect(parsePublicPath('/nope')).toEqual({ kind: 'not-found' });
  });

  it('builds stable paths for browser history updates', () => {
    expect(routePath({ kind: 'section', section: 'uploads' })).toBe('/uploads');
    expect(routePath({ kind: 'watch', id: 42 })).toBe('/watch/42');
    expect(routePath({ kind: 'creator', id: 7 })).toBe('/creator/7');
    expect(routePath({ kind: 'protected', section: 'studio' })).toBe('/studio');
    expect(routePath({ kind: 'search', query: 'hello world' })).toBe(
      '/search?q=hello%20world',
    );
    expect(routePath({ kind: 'search', query: '   ' })).toBe('/search');
  });
});