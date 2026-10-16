import type { User } from '../contexts/AuthContext';

declare const process: {
  env: {
    EXPO_PUBLIC_API_BASE_URL?: string;
  };
};

interface BackendUser {
  id: number;
  email: string;
  username: string;
  is_adult?: boolean;
  adult_mode?: boolean;
}

interface BackendAuthResponse {
  token: string;
  user: BackendUser;
}

interface BackendErrorResponse {
  message?: string;
}

export interface LoginResult {
  token: string;
  user: User;
  isAdultVerified: boolean;
}

const defaultApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

const normalizeApiBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

export const loginWithApi = async (
  email: string,
  password: string,
  apiBaseUrl = defaultApiBaseUrl,
): Promise<LoginResult> => {
  const baseUrl = normalizeApiBaseUrl(apiBaseUrl);
  if (!baseUrl) {
    throw new Error('Sign-in is not configured for this deployment.');
  }

  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let message = 'Unable to sign in. Please check your credentials.';
    try {
      const payload = await response.json() as BackendErrorResponse;
      if (payload.message) message = payload.message;
    } catch {
      // Preserve the safe fallback when the server does not return JSON.
    }
    throw new Error(message);
  }

  const payload = await response.json() as BackendAuthResponse;
  if (!payload.token || !payload.user?.id || !payload.user.email || !payload.user.username) {
    throw new Error('The sign-in response was incomplete.');
  }

  return {
    token: payload.token,
    user: {
      id: String(payload.user.id),
      username: payload.user.username,
      email: payload.user.email,
      adultModeEnabled: payload.user.adult_mode ?? false,
      age: undefined,
    },
    isAdultVerified: payload.user.is_adult ?? false,
  };
};
