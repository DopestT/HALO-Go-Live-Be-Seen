export interface VideoWithEngagement {
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
  live_viewers: number;
  like_count: number;
  comment_count: number;
}

export interface PublicCreator {
  id: number;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface VideoListOptions extends PaginationOptions {
  live?: boolean;
}
