export interface Category {
  id: string;
  name: string;
  description: string;
  visualIdentity: string;
  slug: string;
  order: number;
}

export type SubscriptionTier = 'free' | 'premium';

export interface Album {
  id: string;
  title: string;
  artist?: string;
  duration?: number; // in seconds
  coverUrl: string;
  hlsUrl: string; // Master playlist .m3u8 for adaptive bitrate
  videoHlsUrl?: string; // HLS for reel/preview
  categoryId: string;
  description: string;
  instruments?: string[];
  moodTags?: string[];
  bpm?: number;
  featured?: boolean;
  isDownloaded?: boolean;
  tier: SubscriptionTier;
  playCount?: number;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  tier: SubscriptionTier;
  isAdmin?: boolean;
  subscriptionAmount?: number;
  subscriptionCurrency?: string;
  subscriptionDate?: string;
  totalMinutesStreamed?: number;
  topAlbumId?: string;
  updatedAt?: string;
  stripeCustomerId?: string;
  subscriptionId?: string | null;
  subscriptionStatus?: string;
  betaAccess?: boolean;
}

export interface Favorite {
  userId: string;
  albumId: string;
  createdAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  albumIds: string[];
  createdAt: any;
  updatedAt: any;
}
