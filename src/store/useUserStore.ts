import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Playlist {
  id: string;
  name: string;
  albumIds: string[];
  createdAt: number;
}

interface UserState {
  streak: number;
  lastListenDate: string | null;
  totalListeningTime: number; // in minutes
  recentlyPlayed: string[]; // album IDs
  favorites: string[];
  playlists: Playlist[];
  
  // Actions
  recordListening: (albumId: string, timeInMinutes: number) => void;
  toggleFavorite: (albumId: string) => void;
  createPlaylist: (name: string) => void;
  addAlbumToPlaylist: (playlistId: string, albumId: string) => void;
  removeAlbumFromPlaylist: (playlistId: string, albumId: string) => void;
  deletePlaylist: (playlistId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      streak: 0,
      lastListenDate: null,
      totalListeningTime: 0,
      recentlyPlayed: [],
      favorites: [],
      playlists: [],

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
      })),

      createPlaylist: (name) => set((state) => ({
        playlists: [
          ...state.playlists,
          {
            id: Math.random().toString(36).substr(2, 9),
            name,
            albumIds: [],
            createdAt: Date.now()
          }
        ]
      })),

      addAlbumToPlaylist: (playlistId, albumId) => set((state) => ({
        playlists: state.playlists.map(pl => 
          pl.id === playlistId 
            ? { ...pl, albumIds: pl.albumIds.includes(albumId) ? pl.albumIds : [...pl.albumIds, albumId] }
            : pl
        )
      })),

      removeAlbumFromPlaylist: (playlistId, albumId) => set((state) => ({
        playlists: state.playlists.map(pl => 
          pl.id === playlistId 
            ? { ...pl, albumIds: pl.albumIds.filter(id => id !== albumId) }
            : pl
        )
      })),

      deletePlaylist: (playlistId) => set((state) => ({
        playlists: state.playlists.filter(pl => pl.id !== playlistId)
      }))
    }),
    {
      name: 'natural-tones-user-data'
    }
  )
);
