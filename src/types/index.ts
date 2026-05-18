export interface Category {
  id: string;
  name: string;
  description: string;
  visualIdentity: string;
  slug: string;
  order: number;
}

export type UserRole = 'consumer' | 'business_basic' | 'business_pro' | 'admin';
export type SubscriptionTier = 'free' | 'premium' | 'business_basic' | 'business_pro';

export interface Album {
  id: string;
  title: string;
  artist?: string;
  duration?: number; // in seconds
  coverUrl: string;
  hlsUrl: string; // Master playlist .m3u8 for adaptive bitrate
  videoHlsUrl?: string; // HLS for reel/preview
  previewUrl?: string; // Compatibility
  fullUrl?: string; // Compatibility
  categoryId: string;
  description: string;
  instruments?: string[];
  moodTags?: string[];
  bpm?: number;
  featured?: boolean;
  isFeatured?: boolean; // Compatibility
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
  role: UserRole;
  businessId?: string;
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
  createdAt?: any;
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

export interface BusinessProfile {
  id: string;
  name: string;
  ownerId: string;
  plan: 'business_basic' | 'business_pro';
  active: boolean;
  seatCount: number;
  allowedZones: string[];
  stripeCustomerId?: string;
  subscriptionId?: string;
  address?: string;
  contactEmail?: string;
  logoUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export interface VisualConfig {
  fromColor: string;
  toColor: string;
  blur: number;
  opacity: number;
}

export interface AmbienceScene {
  id: string;
  name: string;
  description: string;
  albumIds: string[];
  visualIdentity: VisualConfig;
  tags: string[];
  isPrebuilt?: boolean;
  businessId?: string;
  createdAt: any;
}

export interface ScheduleEntry {
  id: string;
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sceneId: string;
  zoneId: string;
  active: boolean;
}

export interface BusinessDevice {
  id: string;
  businessId: string;
  name: string;
  lastActive: any;
  status: 'online' | 'offline';
  currentSceneId?: string;
  volume: number;
}
