import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Album, SubscriptionTier } from '../types';

interface PlayerState {
  currentAlbum: Album | null;
  queue: Album[];
  isPlaying: boolean;
  progress: number; // 0 to 1
  currentTime: number;
  duration: number;
  volume: number;
  isMinimized: boolean;
  userTier: SubscriptionTier;
  offlineAlbums: string[];
  preferredQuality: number; // -1 for auto, index for levels
  autoPlayNext: boolean;
  
  // Actions
  setAlbum: (album: Album) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setMinimized: (minimized: boolean) => void;
  setVolume: (volume: number) => void;
  addToQueue: (album: Album) => void;
  removeFromQueue: (albumId: string) => void;
  reorderQueue: (newQueue: Album[]) => void;
  clearQueue: () => void;
  setUserTier: (tier: SubscriptionTier) => void;
  refreshOfflineStatus: (albumIds: string[]) => void;
  setPreferredQuality: (level: number) => void;
  setAutoPlayNext: (enabled: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentAlbum: null,
      queue: [],
      isPlaying: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMinimized: true,
      userTier: 'free',
      offlineAlbums: [],
      preferredQuality: -1,
      autoPlayNext: true,

      setAlbum: (album) => {
        // Subscription check
        if (album.tier === 'premium' && get().userTier !== 'premium') {
          window.dispatchEvent(new CustomEvent('premium-required', { detail: album }));
          return;
        }

        set({ currentAlbum: album, isPlaying: true, currentTime: 0, progress: 0 });
        // Media Session API for background controls
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: album.title,
            artist: album.artist,
            album: album.title,
            artwork: [
              { src: album.coverUrl, sizes: '512x512', type: 'image/jpeg' }
            ]
          });
        }
      },

      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      next: () => {
        const { queue } = get();
        if (queue.length > 0) {
          const nextAlbum = queue[0];
          // Reuse setAlbum logic or handle internal
          if (nextAlbum.tier === 'premium' && get().userTier !== 'premium') {
            window.dispatchEvent(new CustomEvent('premium-required', { detail: nextAlbum }));
            return;
          }
          set({ 
            currentAlbum: nextAlbum, 
            queue: queue.slice(1), 
            isPlaying: true, 
            currentTime: 0,
            progress: 0
          });
        }
      },
      
      previous: () => {
        set({ currentTime: 0, progress: 0 });
      },

      setProgress: (progress) => set({ progress }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),
      setMinimized: (isMinimized) => set({ isMinimized }),
      setVolume: (volume) => set({ volume }),
      addToQueue: (album) => set((state) => ({ 
        queue: state.queue.some(a => a.id === album.id) ? state.queue : [...state.queue, album] 
      })),
      removeFromQueue: (albumId) => set((state) => ({ 
        queue: state.queue.filter(a => a.id !== albumId) 
      })),
      reorderQueue: (newQueue) => set({ queue: newQueue }),
      clearQueue: () => set({ queue: [] }),
      setUserTier: (tier) => set({ userTier: tier }),
      refreshOfflineStatus: (albumIds) => set({ offlineAlbums: albumIds }),
      setPreferredQuality: (level) => set({ preferredQuality: level }),
      setAutoPlayNext: (enabled) => set({ autoPlayNext: enabled }),
    }),
    {
      name: 'dsquaregee-player-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist the non-transient audio state
      partialize: (state) => ({
        currentAlbum: state.currentAlbum,
        queue: state.queue,
        currentTime: state.currentTime,
        volume: state.volume,
        isMinimized: state.isMinimized,
        userTier: state.userTier,
        offlineAlbums: state.offlineAlbums,
        preferredQuality: state.preferredQuality,
        autoPlayNext: state.autoPlayNext,
      }),
    }
  )
);
