import { loginWithApi } from '../src/api/authClient';

describe('loginWithApi', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('fails closed when the API base URL is not configured', async () => {
    await expect(loginWithApi('creator@example.com', 'password123', '')).rejects.toThrow(
      'Sign-in is not configured for this deployment.',
    );
  });

  it('authenticates against the real backend login contract', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'jwt-token',
        user: {
          id: 42,
          email: 'creator@example.com',
          username: 'creator',
          is_adult: true,
          adult_mode: false,
        },
      }),
    } as Response);

    const result = await loginWithApi(
      'creator@example.com',
      'password123',
      'https://api.nscene.watch/',
    );

    expect(global.fetch).toHaveBeenCalledWith('https://api.nscene.watch/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'creator@example.com', password: 'password123' }),
    });
    expect(result).toEqual({
      token: 'jwt-token',
      user: {
        id: '42',
        username: 'creator',
        email: 'creator@example.com',
        adultModeEnabled: false,
        age: undefined,
      },
      isAdultVerified: true,
    });
  });

  it('surfaces a safe error for rejected credentials', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid email or password' }),
    } as Response);

    await expect(
      loginWithApi('creator@example.com', 'wrong-password', 'https://api.nscene.watch'),
    ).rejects.toThrow('Invalid email or password');
  });
});
