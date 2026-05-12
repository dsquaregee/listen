import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp, 
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface Playlist {
  id: string;
  userId: string;
  name: string;
  albumIds: string[];
  createdAt: any;
  updatedAt: any;
}

interface UserState {
  streak: number;
  lastListenDate: string | null;
  totalListeningTime: number; // in minutes
  recentlyPlayed: string[]; // album IDs
  favorites: string[];
  playlists: Playlist[];
  
  // Actions
  setPlaylists: (playlists: Playlist[]) => void;
  recordListening: (albumId: string, timeInMinutes: number) => void;
  toggleFavorite: (albumId: string) => void;
  createPlaylist: (userId: string, name: string) => Promise<void>;
  addAlbumToPlaylist: (playlistId: string, albumId: string) => Promise<void>;
  removeAlbumFromPlaylist: (playlistId: string, albumId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
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

      setPlaylists: (playlists) => set({ playlists }),

      recordListening: async (albumId, timeInMinutes) => {
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

        // Sync to Firestore if authenticated
        if (auth.currentUser) {
          try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
              totalMinutesStreamed: get().totalListeningTime,
              updatedAt: serverTimestamp()
            });

            // Also increment album play count
            const albumRef = doc(db, 'albums', albumId);
            await updateDoc(albumRef, {
              playCount: increment(1)
            });
          } catch (e) {
            console.error('Failed to sync metrics:', e);
          }
        }
      },

      toggleFavorite: (albumId) => set((state) => ({
        favorites: state.favorites.includes(albumId)
          ? state.favorites.filter(id => id !== albumId)
          : [...state.favorites, albumId]
      })),

      createPlaylist: async (userId, name) => {
        try {
          const playlistData = {
            userId,
            name,
            albumIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await addDoc(collection(db, 'playlists'), playlistData);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'playlists');
        }
      },

      addAlbumToPlaylist: async (playlistId, albumId) => {
        try {
          const playlistRef = doc(db, 'playlists', playlistId);
          await updateDoc(playlistRef, {
            albumIds: arrayUnion(albumId),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `playlists/${playlistId}`);
        }
      },

      removeAlbumFromPlaylist: async (playlistId, albumId) => {
        try {
          const playlistRef = doc(db, 'playlists', playlistId);
          await updateDoc(playlistRef, {
            albumIds: arrayRemove(albumId),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `playlists/${playlistId}`);
        }
      },

      deletePlaylist: async (playlistId) => {
        try {
          await deleteDoc(doc(db, 'playlists', playlistId));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `playlists/${playlistId}`);
        }
      }
    }),
    {
      name: 'natural-tones-user-data',
      partialize: (state) => ({
        streak: state.streak,
        lastListenDate: state.lastListenDate,
        totalListeningTime: state.totalListeningTime,
        recentlyPlayed: state.recentlyPlayed,
        favorites: state.favorites,
      }), // Don't persist playlists locally, we'll fetch from Firestore
    }
  )
);
