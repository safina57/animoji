export interface ImageUser {
  id: string;
  name: string;
  avatar_url: string;
}

export interface ImageFeedItem {
  id: string;
  thumbnail_url: string;
  generated_url: string;
  prompts: string[];
  width: number;
  height: number;
  created_at: string;
  user: ImageUser;
  is_liked_by_user?: boolean; // populated by API when authenticated, updated locally via Redux
}

export interface ImageDetailItem extends ImageFeedItem {
  likes_count: number;
}

export interface PublicImagesResponse {
  images: ImageFeedItem[];
  has_more: boolean;
  offset: number;
  limit: number;
}
