import vercelConfig from '../vercel.json';

describe('Vercel SPA routing', () => {
  it('serves the Expo web entrypoint for every NSCENE client-side route', () => {
    expect(vercelConfig.rewrites).toContainEqual({ source: '/(.*)', destination: '/' });
  });
});
