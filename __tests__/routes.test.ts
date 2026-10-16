import { creatorRoute, publicRouteFor, watchRoute } from '../src/routes';

describe('NSCENE public routes', () => {
  it('maps every public section to its canonical path', () => {
    expect(publicRouteFor('live')).toBe('/live');
    expect(publicRouteFor('uploads')).toBe('/uploads');
    expect(publicRouteFor('clips')).toBe('/clips');
    expect(publicRouteFor('shows')).toBe('/shows');
    expect(publicRouteFor('creators')).toBe('/creators');
    expect(publicRouteFor('communities')).toBe('/communities');
  });

  it('builds watch and creator detail routes', () => {
    expect(watchRoute(42)).toBe('/watch/42');
    expect(creatorRoute(7)).toBe('/creator/7');
  });
});
