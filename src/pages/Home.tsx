import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, TrendingUp, Star, Clock, ChevronRight, Crown } from 'lucide-react';
import { MOCK_CATEGORIES, MOCK_ALBUMS } from '../data/mockData';
import { usePlayerStore } from '../store/usePlayerStore';
import { Link } from 'react-router-dom';
import { cn, formatTime } from '../lib/utils';
import { OptimizedImage } from '../components/OptimizedImage';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category } from '../types';

export default function Home() {
  const { setAlbum, recentlyPlayed } = usePlayerStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Album | null>(null);
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [trendingAlbums, setTrendingAlbums] = useState<Album[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch Categories
        const catQ = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const catSn = await getDocs(catQ);
        const cats = catSn.empty 
          ? MOCK_CATEGORIES 
          : catSn.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(cats);

        // Fetch Albums
        const albumQ = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
        const albumSn = await getDocs(albumQ);
        const albums = albumSn.empty 
          ? MOCK_ALBUMS 
          : albumSn.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
        
        setFeatured(albums[0] || MOCK_ALBUMS[0]);
        setRecentAlbums(albums.slice(1, 5));
        setTrendingAlbums([...albums].sort(() => Math.random() - 0.5).slice(0, 6));
      } catch (e) {
        console.error('Failed to fetch data:', e);
        setCategories(MOCK_CATEGORIES);
        setFeatured(MOCK_ALBUMS[0]);
        setRecentAlbums(MOCK_ALBUMS.slice(1, 5));
        setTrendingAlbums(MOCK_ALBUMS.slice(5, 10));
      }
    };
    fetchInitialData();
  }, []);

  if (!featured) return null;

  return (
    <div className="pt-16 px-4 pb-12 overflow-x-hidden">
      {/* Hero Banner */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[45vh] sm:h-[55vh] rounded-2xl overflow-hidden mb-12 group shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
        <OptimizedImage 
          src={featured.coverUrl} 
          alt={featured.title} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-70" 
        />
        
        <div className="relative z-20 h-full flex flex-col justify-end p-8 sm:p-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex gap-2 items-center mb-4">
              <span className="bg-[#F4C430] text-black text-[10px] font-bold px-2 py-0.5 w-fit rounded uppercase tracking-wider block">
                Featured Journey
              </span>
              {featured.tier === 'premium' && (
                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 w-fit rounded uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" /> Premium
                </span>
              )}
            </div>
            <h1 className="text-5xl sm:text-7xl font-serif italic text-white leading-tight mb-4">
              {featured.title}
            </h1>
            <p className="text-sm sm:text-base text-white/70 mt-2 line-clamp-2 leading-relaxed max-w-lg mb-8">
              {featured.description}
            </p>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setAlbum(featured)}
                className="bg-[#F4C430] text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Start Journey
              </button>
              <Link 
                to={`/album/${featured.id}`}
                className="border border-white/30 backdrop-blur-md px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Preview Clip
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section className="mb-12 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Recently Played</h2>
            <Link to="/profile" className="text-[10px] text-[#D4AF37] uppercase font-bold cursor-pointer hover:underline">Full History</Link>
          </div>
          <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar">
            {recentlyPlayed.map((album) => (
              <motion.div 
                key={album.id + '-recent'}
                whileHover={{ y: -5 }}
                className="flex-shrink-0 w-64 group cursor-pointer"
                onClick={() => setAlbum(album)}
              >
                <div className="relative aspect-square bg-[#1a1a1a] rounded-xl overflow-hidden mb-3 border border-white/5 ring-1 ring-white/5 shadow-xl">
                  <OptimizedImage src={album.coverUrl} alt={album.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                  {album.tier === 'premium' && (
                    <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white">
                      <Crown className="w-3 h-3" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-10 h-10 text-white fill-current" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-white group-hover:text-primary transition-colors truncate">{album.title}</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 truncate">{album.artist} • {album.moodTags[0]}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Continue Listening */}
      <section className="mb-12 px-4">
         <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Continue Your Journey</h2>
          <span className="text-[10px] text-[#D4AF37] uppercase font-bold cursor-pointer hover:underline">View All</span>
        </div>
        <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar">
           {recentAlbums.map((album) => (
             <motion.div 
              key={album.id}
              whileHover={{ y: -5 }}
              className="flex-shrink-0 w-72 group cursor-pointer"
              onClick={() => setAlbum(album)}
             >
                <div className="relative aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden mb-3 border border-white/5 ring-1 ring-white/5 shadow-xl">
                  <OptimizedImage src={album.coverUrl} alt={album.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60" />
                  {album.tier === 'premium' && (
                    <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white">
                      <Crown className="w-3 h-3" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 h-1 bg-[#F4C430] w-1/3 shadow-[0_0_10px_rgba(244,196,48,0.5)]" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-10 h-10 text-white fill-current" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-white group-hover:text-primary transition-colors">{album.title}</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 truncate">{formatTime(album.duration)} • {album.moodTags?.[0] || 'Atmospheric'}</p>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mb-12 px-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-6">Immersive Worlds</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/category/${cat.slug}`}
              className={cn(
                "h-28 rounded-xl border border-white/5 flex flex-col justify-end p-5 group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden",
                cat.visualIdentity
              )}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Play className="w-20 h-20 rotate-12" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-1">{cat.name}</span>
              <span className="text-[9px] opacity-60 text-white uppercase tracking-tighter">{cat.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Row */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 px-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Trending This Week
          </h2>
        </div>
        <div className="flex overflow-x-auto gap-6 px-4 pb-4 no-scrollbar">
           {trendingAlbums.map((album) => (
             <Link 
              key={album.id + '-trending'} 
              to={`/album/${album.id}`}
              className="flex-shrink-0 w-64 group"
             >
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-4 ring-1 ring-white/5 shadow-xl">
                  <OptimizedImage src={album.coverUrl} alt={album.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  {album.tier === 'premium' && (
                    <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white">
                      <Crown className="w-3 h-3" />
                    </div>
                  )}
                   <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-white/10 uppercase tracking-tighter">
                    {formatTime(album.duration)}
                  </div>
                </div>
                <h3 className="text-white font-medium truncate group-hover:text-primary transition-colors">{album.title}</h3>
                <p className="text-slate-400 text-sm truncate">{album.artist}</p>
             </Link>
           ))}
        </div>
      </section>
    </div>
  );
}
