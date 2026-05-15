import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Transforms a local asset path to a CDN URL if VITE_CDN_URL is configured.
 * Safely handles full URLs (Supabase, Unsplash) by passing them through.
 */
export function getAssetUrl(path: string | undefined): string | undefined {
  if (!path || !path.trim()) return undefined;
  
  const trimmedPath = path.trim();
  
  // If it's already a full URL, don't change it
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://') || trimmedPath.startsWith('data:')) {
    return trimmedPath;
  }

  const cdnUrl = import.meta.env.VITE_CDN_URL;
  if (!cdnUrl) return trimmedPath;

  // Ensure path starts with / and cdnUrl doesn't end with /
  const cleanPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  const cleanCdn = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;

  return `${cleanCdn}${cleanPath}`;
}

export function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
