# Integration Guide: HALO Frontend ↔ Backend API

This guide explains how to integrate the HALO mobile app (React Native) with the Go backend API Gateway.

## Backend API Overview

**Base URL (Development)**: `http://localhost:8080`
**Base URL (Production)**: `https://api.halo.example.com` (configure as needed)

## Authentication Flow

### 1. User Registration

**Endpoint**: `POST /api/v1/auth/register`

**Request**:
```typescript
interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  display_name: string;
  is_adult: boolean;
}
```

**Response**:
```typescript
interface AuthResponse {
  token: string;
  user: User;
}

interface User {
  id: number;
  email: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  is_adult: boolean;
  adult_mode: boolean;
  created_at: string;
  updated_at: string;
}
```

**Example (JavaScript/TypeScript)**:
```typescript
const registerUser = async (data: RegisterRequest) => {
  const response = await fetch('http://localhost:8080/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Registration failed');
  }
  
  const result: AuthResponse = await response.json();
  // Store token in secure storage (AsyncStorage, SecureStore)
  await AsyncStorage.setItem('auth_token', result.token);
  return result;
};
```

### 2. User Login

**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response**: Same as registration (`AuthResponse`)

**Example**:
```typescript
const loginUser = async (email: string, password: string) => {
  const response = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  const result: AuthResponse = await response.json();
  await AsyncStorage.setItem('auth_token', result.token);
  return result;
};
```

### 3. Get Current User Profile

**Endpoint**: `GET /api/v1/auth/me`
**Authentication**: Required

**Example**:
```typescript
const getCurrentUser = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  
  const response = await fetch('http://localhost:8080/api/v1/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }
  
  return await response.json();
};
```

## Video Metadata Flow

### 1. Get Videos (Feed)

**Endpoint**: `GET /api/v1/videos`

**Query Parameters**:
- `limit` (optional): Number of videos (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `live` (optional): Filter by live status (`true` or `false`)

**Response**:
```typescript
interface VideoWithEngagement {
  id: number;
  user_id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  stream_url: string;
  is_live: boolean;
  is_adult_content: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Real-time engagement from Redis
  live_viewers: number;
  like_count: number;
  comment_count: number;
}
```

**Example**:
```typescript
const getVideos = async (limit = 20, offset = 0, liveOnly = false) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    ...(liveOnly && { live: 'true' }),
  });
  
  const response = await fetch(
    `http://localhost:8080/api/v1/videos?${params}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch videos');
  }
  
  return await response.json();
};
```

### 2. Get Single Video

**Endpoint**: `GET /api/v1/videos/:id`

**Response**: Same as above (`VideoWithEngagement`)

**Example**:
```typescript
const getVideo = async (videoId: number) => {
  const response = await fetch(
    `http://localhost:8080/api/v1/videos/${videoId}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch video');
  }
  
  return await response.json();
};
```

### 3. Get User Videos

**Endpoint**: `GET /api/v1/users/:user_id/videos`

**Query Parameters**: Same as get videos

**Example**:
```typescript
const getUserVideos = async (userId: number, limit = 20) => {
  const response = await fetch(
    `http://localhost:8080/api/v1/users/${userId}/videos?limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch user videos');
  }
  
  return await response.json();
};
```

## Engagement Tracking

### Increment Engagement Metric

**Endpoint**: `POST /api/v1/videos/:id/engagement/:metric`
**Authentication**: Required

**Metrics**:
- `likes` - Increment like count
- `comments` - Increment comment count
- `live_viewers` - Increment live viewer count

**Example**:
```typescript
const incrementEngagement = async (
  videoId: number,
  metric: 'likes' | 'comments' | 'live_viewers'
) => {
  const token = await AsyncStorage.getItem('auth_token');
  
  const response = await fetch(
    `http://localhost:8080/api/v1/videos/${videoId}/engagement/${metric}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to increment engagement');
  }
  
  return await response.json();
};
```

## Complete API Client Example

```typescript
// api/client.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:8080';

class APIClient {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token && !options.headers?.['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return await response.json();
  }

  // Auth methods
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await AsyncStorage.setItem('auth_token', result.token);
    return result;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await AsyncStorage.setItem('auth_token', result.token);
    return result;
  }

  async getCurrentUser(): Promise<User> {
    return await this.request<User>('/api/v1/auth/me');
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
  }

  // Video methods
  async getVideos(params?: {
    limit?: number;
    offset?: number;
    live?: boolean;
  }): Promise<VideoWithEngagement[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    if (params?.live) query.set('live', 'true');
    
    return await this.request<VideoWithEngagement[]>(
      `/api/v1/videos?${query}`
    );
  }

  async getVideo(videoId: number): Promise<VideoWithEngagement> {
    return await this.request<VideoWithEngagement>(
      `/api/v1/videos/${videoId}`
    );
  }

  async getUserVideos(
    userId: number,
    limit = 20
  ): Promise<VideoWithEngagement[]> {
    return await this.request<VideoWithEngagement[]>(
      `/api/v1/users/${userId}/videos?limit=${limit}`
    );
  }

  async incrementEngagement(
    videoId: number,
    metric: 'likes' | 'comments' | 'live_viewers'
  ): Promise<void> {
    await this.request(`/api/v1/videos/${videoId}/engagement/${metric}`, {
      method: 'POST',
    });
  }
}

export const apiClient = new APIClient();
```

## Integration with AuthContext

Update your existing `AuthContext.tsx`:

```typescript
import { apiClient } from './api/client';

// In your AuthProvider
const signIn = async (email: string, password: string) => {
  try {
    const response = await apiClient.login(email, password);
    setUser(response.user);
    // Update your context state
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

const signUp = async (data: RegisterRequest) => {
  try {
    const response = await apiClient.register(data);
    setUser(response.user);
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};
```

## Adult Content Filtering

The backend provides `is_adult_content` flag on videos. Use `filterContentForUser` utility:

```typescript
import { filterContentForUser } from './utils/filterContentForUser';

const getFilteredVideos = async () => {
  const videos = await apiClient.getVideos();
  const user = await apiClient.getCurrentUser();
  
  // Filter based on user's adult mode setting
  return filterContentForUser(videos, user);
};
```

## Error Handling

All API errors follow this format:

```typescript
interface ErrorResponse {
  error: string;      // Error code (e.g., "invalid_credentials")
  message?: string;   // Human-readable message
}
```

Common error codes:
- `unauthorized` - Invalid or missing token
- `invalid_credentials` - Wrong email/password
- `user_exists` - Email already registered
- `not_found` - Resource not found
- `rate_limit_exceeded` - Too many requests
- `invalid_request` - Validation error

## Health Check

Use the health endpoint to verify backend connectivity:

```typescript
const checkBackendHealth = async () => {
  const response = await fetch('http://localhost:8080/health');
  const data = await response.json();
  return data.status === 'healthy';
};
```

## Production Considerations

1. **Base URL**: Update `BASE_URL` for production environment
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Use SecureStore for production token storage
4. **Error Handling**: Implement proper error boundaries
5. **Retry Logic**: Add retry for network failures
6. **Offline Support**: Cache data for offline viewing

## Next Steps

1. Install the API client in your React Native project
2. Update AuthContext to use the backend API
3. Update video feed to fetch from backend
4. Implement engagement tracking
5. Test with Docker Compose backend
6. Deploy backend to production

For questions, see backend README.md or ARCHITECTURE.md.
