import vercelConfig from '../vercel.json';

describe('Vercel SPA routing', () => {
  it('serves real build files first, then falls back to the Expo web entrypoint for client-side routes', () => {
    expect(vercelConfig.routes).toEqual([
      { handle: 'filesystem' },
      { src: '/.*', dest: '/' },
    ]);
  });
});
