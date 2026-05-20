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
  recentlyPlayed: Album[];
  isShuffled: boolean;
  
  // Actions
  setAlbum: (album: Album) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
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
      recentlyPlayed: [],
      isShuffled: false,

      setAlbum: (album) => {
        const current = get();
        
        // Subscription check FIRST
        if (album.tier === 'premium' && current.userTier !== 'premium') {
          window.dispatchEvent(new CustomEvent('premium-required', { detail: album }));
          return;
        }

        // If same album, just ensure playing
        if (current.currentAlbum?.id === album.id) {
          if (!current.isPlaying) set({ isPlaying: true });
          return;
        }

        const { recentlyPlayed } = get();
        // Add to history, removing any existing entry for the same album to push it to the front
        const newRecentlyPlayed = [
          album,
          ...recentlyPlayed.filter(a => a.id !== album.id)
        ].slice(0, 5);

        set({ 
          currentAlbum: album, 
          isPlaying: true, 
          currentTime: 0, 
          progress: 0,
          recentlyPlayed: newRecentlyPlayed 
        });
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
      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
      
      next: () => {
        const { queue, isShuffled } = get();

        if (queue.length > 0) {
          let nextAlbum: Album;
          let newQueue: Album[];

          if (isShuffled) {
            const randomIndex = Math.floor(Math.random() * queue.length);
            nextAlbum = queue[randomIndex];
            newQueue = [...queue.slice(0, randomIndex), ...queue.slice(randomIndex + 1)];
          } else {
            nextAlbum = queue[0];
            newQueue = queue.slice(1);
          }

          // Subscription check
          if (nextAlbum.tier === 'premium' && get().userTier !== 'premium') {
            window.dispatchEvent(new CustomEvent('premium-required', { detail: nextAlbum }));
            return;
          }

          set({ 
            currentAlbum: nextAlbum, 
            queue: newQueue, 
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
      addToQueue: (album) => {
        // Subscription check for adding to queue
        if (album.tier === 'premium' && get().userTier !== 'premium') {
          window.dispatchEvent(new CustomEvent('premium-required', { detail: album }));
          return;
        }

        set((state) => ({ 
          queue: state.queue.some(a => a.id === album.id) ? state.queue : [...state.queue, album] 
        }));
      },
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
      // CRITICAL: DO NOT PERSIST userTier to prevent bypass via localStorage
      partialize: (state) => ({
        currentAlbum: state.currentAlbum ? {
          id: state.currentAlbum.id,
          title: state.currentAlbum.title,
          artist: state.currentAlbum.artist,
          coverUrl: state.currentAlbum.coverUrl,
          hlsUrl: state.currentAlbum.hlsUrl
        } : null,
        queue: state.queue.map(a => ({
          id: a.id,
          title: a.title,
          artist: a.artist,
          coverUrl: a.coverUrl,
          hlsUrl: a.hlsUrl
        })),
        currentTime: state.currentTime,
        volume: state.volume,
        isMinimized: state.isMinimized,
        offlineAlbums: state.offlineAlbums,
        preferredQuality: state.preferredQuality,
        autoPlayNext: state.autoPlayNext,
        recentlyPlayed: state.recentlyPlayed.map(a => ({
          id: a.id,
          title: a.title,
          artist: a.artist,
          coverUrl: a.coverUrl,
          hlsUrl: a.hlsUrl
        })),
        isShuffled: state.isShuffled,
      }),
    }
  )
);
