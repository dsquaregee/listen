import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Album } from '../types';
import AlbumCard from '../components/AlbumCard';
import { motion } from 'motion/react';
import { Library as LibraryIcon, Music, Search, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Skeleton from '../components/ui/Skeleton';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { toast } from 'sonner';

export default function Library() {
  const { user: profile } = useAuthStore();
  
  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Portal connection failed.');
    }
  };
  const [purchasedAlbums, setPurchasedAlbums] = useState<Album[]>([]);
  const [favoriteAlbums, setFavoriteAlbums] = useState<Album[]>([]);
  const [activeTab, setActiveTab] = useState<'collection' | 'favorites'>('collection');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLibrary() {
      if (!profile) {
        setLoading(false);
        return;
      }

      try {
        const fetchAlbumData = async (collPath: string) => {
          const snap = await getDocs(collection(db, 'users', profile.uid, collPath));
          const albumIds = snap.docs.map(doc => doc.data().albumId);
          const albumPromises = albumIds.map(id => getDoc(doc(db, 'albums', id)));
          const albumSnaps = await Promise.all(albumPromises);
          return albumSnaps
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, ...snap.data() } as Album));
        };

        const [purchased, favorites] = await Promise.all([
          fetchAlbumData('purchases'),
          fetchAlbumData('favorites')
        ]);
          
        setPurchasedAlbums(purchased);
        setFavoriteAlbums(favorites);
      } catch (error) {
        console.error("Error fetching library:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLibrary();
  }, [profile]);

  const displayAlbums = activeTab === 'collection' ? purchasedAlbums : favoriteAlbums;

  const filteredAlbums = displayAlbums.filter(album => {
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = album.title.toLowerCase().includes(searchLower);
    const moodMatch = album.moodTags.some(tag => tag.toLowerCase().includes(searchLower));
    return titleMatch || moodMatch;
  });

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <LibraryIcon size={64} className="text-zinc-700 mb-6" />
        <h2 className="font-serif text-3xl font-bold mb-4">Your Private Sanctuary</h2>
        <p className="text-zinc-500 max-w-md mb-8">
          Sign in to access your high-fidelity music collections and atmospheric explorations.
        </p>
        <button 
          onClick={login}
          className="bg-gold text-black px-12 py-3 rounded-full font-bold transition-all hover:bg-gold-light"
        >
          Sign In to Library
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
          <div className="space-y-4">
            <Skeleton className="w-64 h-12" />
            <Skeleton className="w-48 h-5" />
          </div>
          <Skeleton className="w-full sm:w-64 h-10" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="w-3/4 h-4 sm:h-5" />
              <Skeleton className="w-1/2 h-3 sm:h-4 opacity-60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-24 sm:pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="font-serif text-4xl font-bold flex items-center gap-4">
              <LibraryIcon size={32} className="text-gold" />
              Your Library
            </h1>
          </div>
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('collection')}
              className={`text-sm font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${
                activeTab === 'collection' ? 'text-gold border-gold' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              Unlocked ({purchasedAlbums.length})
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={`text-sm font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${
                activeTab === 'favorites' ? 'text-gold border-gold' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              Favorites ({favoriteAlbums.length})
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              id="library-search"
              name="library-search"
              type="text" 
              placeholder="Search journeys or moods..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div className="flex gap-2 text-[10px] uppercase tracking-widest font-bold">
            {['Ambient', 'Focus', 'Cinematic'].map(tag => (
              <button 
                key={tag}
                onClick={() => setSearchTerm(tag === searchTerm ? '' : tag)}
                className={`px-3 py-1 rounded-full border transition-all ${
                  searchTerm.toLowerCase() === tag.toLowerCase() 
                    ? 'bg-gold text-black border-gold' 
                    : 'bg-white/5 text-zinc-500 border-white/5 hover:border-white/20'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredAlbums.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8">
          {filteredAlbums.map((album, idx) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <AlbumCard album={album} isOwned={activeTab === 'collection'} />
            </motion.div>
          ))}
        </div>
      ) : displayAlbums.length > 0 ? (
        <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed">
          <p className="text-zinc-500">No journeys matching "{searchTerm}" found in this section.</p>
          <button 
            onClick={() => setSearchTerm('')}
            className="text-gold text-sm font-bold mt-4 hover:underline"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="text-center py-32 bg-zinc-900/50 rounded-3xl border border-white/5 border-dashed">
          <Heart size={48} className="mx-auto text-zinc-700 mb-6" />
          <h3 className="font-serif text-2xl text-zinc-400 mb-2">
            {activeTab === 'collection' ? 'The Vault is Empty' : 'No Soul-Favorites Yet'}
          </h3>
          <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
            {activeTab === 'collection' 
              ? "You haven't unlocked any collections yet. Start your journey in the store."
              : "Heart your favorite journeys to keep them close to your spirit."}
          </p>
          <Link 
            to="/" 
            className="text-gold font-bold hover:underline"
          >
            Explore Recordings →
          </Link>
        </div>
      )}
    </div>
  );
}
