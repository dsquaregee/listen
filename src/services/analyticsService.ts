import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Album } from '../types';

export interface ListeningSession {
  userId: string;
  userEmail?: string;
  albumId: string;
  albumTitle: string;
  duration: number; // in seconds
  startTime: any;
  location?: {
    lat: number;
    lng: number;
    city?: string;
  };
}

class AnalyticsService {
  private async getGeoLocation(): Promise<{ lat: number; lng: number } | undefined> {
    try {
      if ('geolocation' in navigator) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            () => resolve(undefined),
            { timeout: 5000 }
          );
        });
      }
    } catch (e) {
      console.error('Geolocation failed:', e);
    }
    return undefined;
  }

  async recordSession(album: Album, duration: number) {
    const user = auth.currentUser;
    if (!user || duration < 5) return; // Don't record very short sessions or anonymous ones for now

    try {
      const location = await this.getGeoLocation();
      
      // Digital Tracer: A unique ID linked to this specific listening resonance.
      // Used for forensic tracking of content distribution.
      const proofOfOriginId = `ORIGIN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // TTL: Set session to expire in 90 days for database hygiene
      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + 90);

      const sessionData = {
        userId: user.uid,
        userEmail: user.email,
        albumId: album.id,
        albumTitle: album.title,
        duration: Math.floor(duration),
        startTime: serverTimestamp(),
        expireAt, // Used for Firestore TTL policies
        location,
        proofOfOriginId,
        userAgent: navigator.userAgent.substring(0, 100),
        ipContext: 'SERVER_CAPTURED'
      };

      await addDoc(collection(db, 'listening_sessions'), sessionData);
      console.log('Session recorded with Digital Tracer:', proofOfOriginId);
    } catch (error) {
      console.error('Failed to record session:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
