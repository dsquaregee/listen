import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  streak: number;
  lastListenDate: string | null;
  totalListeningTime: number; // in minutes
  recentlyPlayed: string[]; // album IDs
  favorites: string[];
  
  // Actions
  recordListening: (albumId: string, timeInMinutes: number) => void;
  toggleFavorite: (albumId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      streak: 0,
      lastListenDate: null,
      totalListeningTime: 0,
      recentlyPlayed: [],
      favorites: [],

      recordListening: (albumId, timeInMinutes) => {
        const today = new Date().toDateString();
        const last = get().lastListenDate;
        
        set((state) => {
          let newStreak = state.streak;
          if (last !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (last === yesterday.toDateString()) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
          }

          const filteredRecent = state.recentlyPlayed.filter(id => id !== albumId);
          return {
            streak: newStreak,
            lastListenDate: today,
            totalListeningTime: state.totalListeningTime + timeInMinutes,
            recentlyPlayed: [albumId, ...filteredRecent].slice(0, 10)
          };
        });
      },

      toggleFavorite: (albumId) => set((state) => ({
        favorites: state.favorites.includes(albumId)
          ? state.favorites.filter(id => id !== albumId)
          : [...state.favorites, albumId]
      }))
    }),
    {
      name: 'natural-tones-user-data'
    }
  )
);
