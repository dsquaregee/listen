// src/pages/Home.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, TrendingUp, ChevronRight, Crown, ListMusic } from 'lucide-react';
import { MOCK_CATEGORIES, MOCK_ALBUMS } from '../data/mockData';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUserStore } from '../store/useUserStore';
import { Link } from 'react-router-dom';
import { cn, formatTime } from '../lib/utils';
import { OptimizedImage } from '../components/OptimizedImage';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, Album } from '../types';

export default function Home() {
  const { setAlbum, recentlyPlayed } = usePlayerStore();
  const { playlists } = useUserStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [featured, setFeatured] = useState<Album | null>(null);

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
        const fetchedAlbums = albumSn.empty 
          ? MOCK_ALBUMS 
          : albumSn.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
        
        setAlbums(fetchedAlbums);
        setFeatured(fetchedAlbums.find(a => a.featured) || fetchedAlbums[0] || MOCK_ALBUMS[0]);
      } catch (e) {
        console.error('Failed to fetch data:', e);
        setCategories(MOCK_CATEGORIES);
        setAlbums(MOCK_ALBUMS);
        setFeatured(MOCK_ALBUMS[0]);
      }
    };
    fetchInitialData();
  }, []);

  if (!featured) return null;

  const albumsByCategory = categories.reduce((acc, cat) => {
    // 1. Get albums from Firestore that match this category
    const dbAlbums = albums.filter(album => album.categoryId === cat.id);
    
    // 2. If Firestore is empty for this category, try to find matching mock albums
    // This helps during transitions when categories are created but albums aren't yet
    if (dbAlbums.length === 0) {
      const mockCat = MOCK_CATEGORIES.find(c => c.slug?.toLowerCase() === cat.slug?.toLowerCase());
      const mockAlbums = MOCK_ALBUMS.filter(a => a.categoryId === cat.id || (mockCat && a.categoryId === mockCat.id));
      acc[cat.id] = mockAlbums;
    } else {
      acc[cat.id] = dbAlbums;
    }
    
    return acc;
  }, {} as Record<string, Album[]>);

  return (
    <div className="pt-16 px-4 pb-20 overflow-x-hidden min-h-screen">
      {/* Hero Banner - Cinematic Focus */}
      <motion.section 
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative h-[45vh] sm:h-[55vh] rounded-3xl overflow-hidden mb-12 group shadow-2xl mx-auto max-w-7xl"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />
        <OptimizedImage 
          src={featured.coverUrl} 
          alt={featured.title} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 group-hover:scale-110 opacity-80" 
        />
        
        <div className="relative z-20 h-full flex flex-col justify-end p-8 sm:p-12 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="flex gap-2 items-center mb-4">
              <span className="bg-accent text-black text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
                Featured Experience
              </span>
              {featured.tier === 'premium' && (
                <span className="bg-white/10 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-white/20 flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-accent" /> Premium
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-6xl font-serif italic text-white leading-[1.1] mb-4 drop-shadow-2xl">
              {featured.title}
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1 line-clamp-2 leading-relaxed max-w-xl mb-8 font-light italic">
              {featured.description}
            </p>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setAlbum(featured)}
                className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary transition-colors shadow-lg active:scale-95 duration-200"
              >
                Immerse Now
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Categories with Horizontal Albums */}
      <div className="max-w-7xl mx-auto space-y-20">
        {playlists.length > 0 && (
          <section className="px-4">
            <div className="flex justify-between items-end mb-8 border-b border-accent/10 pb-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif italic text-white mb-2">My Playlists</h2>
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-accent/40">Personal Soundscapes</p>
              </div>
              <Link 
                to="/playlists"
                className="text-[10px] text-accent uppercase font-bold tracking-widest hover:text-white transition-colors mb-2"
              >
                Manage All
              </Link>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
              {playlists.map(pl => (
                <Link 
                  key={pl.id} 
                  to={`/playlist/${pl.id}`}
                  className="flex-shrink-0 w-48 group"
                >
                  <div className="aspect-square bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mb-3 group-hover:border-accent/40 transition-colors">
                    <ListMusic className="w-8 h-8 text-white/20 group-hover:text-accent transition-colors" />
                  </div>
                  <h4 className="text-sm font-serif italic text-white group-hover:text-accent transition-colors truncate">{pl.name}</h4>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest">{pl.albumIds.length} Experiences</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {categories.map((cat, catIdx) => (
          <motion.section 
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: catIdx * 0.1, duration: 0.8 }}
            className="px-4"
          >
            <div className="flex justify-between items-end mb-8 border-b border-accent/10 pb-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif italic text-white mb-2">{cat.name}</h2>
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-accent/40">{cat.description}</p>
              </div>
              <Link 
                to={`/explore?category=${cat.id}`}
                className="text-[10px] text-accent uppercase font-bold tracking-widest hover:text-white transition-colors mb-2"
              >
                Explore All
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-8 pb-8 no-scrollbar -mx-4 px-4">
              {albumsByCategory[cat.id]?.length > 0 ? (
                albumsByCategory[cat.id].map((album, idx) => (
                  <motion.div 
                    key={album.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -10 }}
                    className="flex-shrink-0 w-72 sm:w-80 group cursor-pointer"
                    onClick={() => setAlbum(album)}
                  >
                    <div className="relative aspect-[4/5] bg-[#1a1a1a] rounded-[2rem] overflow-hidden mb-6 border border-white/5 shadow-2xl transition-all duration-500 group-hover:shadow-accent/10 group-hover:border-accent/30">
                      <OptimizedImage 
                        src={album.coverUrl} 
                        alt={album.title} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      
                      {album.tier === 'premium' && (
                        <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-accent border border-white/10">
                          <Crown className="w-3 h-3" />
                        </div>
                      )}
                      
                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl group-hover:bg-accent transition-colors">
                          <Play className="w-4 h-4 text-black fill-current" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-serif italic text-white group-hover:text-accent transition-colors mb-2 truncate">
                      {album.title}
                    </h3>
                    <p className="text-xs text-white/40 line-clamp-2 leading-relaxed font-light italic">
                      {album.description.length > 80 ? album.description.substring(0, 80) + '...' : album.description}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="py-12 px-8 bg-white/5 rounded-3xl border border-dashed border-white/10 text-white/20 italic text-sm">
                  Musical journeys coming soon to this world...
                </div>
              )}
            </div>
          </motion.section>
        ))}
      </div>

      {/* Global Explorer - Show all albums regardless of category */}
      <section className="mt-32 max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12 border-b border-accent/10 pb-6">
          <div>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold italic text-white mb-3">Infinite Resonance</h2>
            <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-accent/40">Exploring every frequency in the cinematic spectrum</p>
          </div>
          <div className="text-[10px] text-accent/30 uppercase font-bold tracking-widest mb-3">
            {albums.length} Manifestations
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {albums.map((album, idx) => (
            <motion.div 
              key={album.id + '-global'}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (idx % 4) * 0.1 }}
              className="group cursor-pointer"
              onClick={() => setAlbum(album)}
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden mb-4 shadow-xl group-hover:shadow-accent/5 group-hover:border-accent/20 border border-transparent transition-all">
                <OptimizedImage 
                  src={album.coverUrl} 
                  alt={album.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-10 h-10 text-white fill-current" />
                </div>
              </div>
              <h4 className="text-lg font-serif italic text-white group-hover:text-accent transition-colors truncate">{album.title}</h4>
              <p className="text-[9px] uppercase tracking-widest text-accent/50 font-bold mt-1">
                {categories.find(c => c.id === album.categoryId)?.name || 'Unknown Cosmos'}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending / Global - Sophisticated Footer section */}
      <section className="mt-32 max-w-7xl mx-auto px-4 mb-20 text-center">
        <div className="h-px w-24 bg-accent mx-auto mb-12 opacity-30" />
        <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-accent/20 mb-8">Harmonizing the Future</h2>
        <div className="flex flex-wrap justify-center gap-12 sm:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
          <TrendingUp className="w-8 h-8 text-accent" />
          <Play className="w-8 h-8 text-accent" />
          <Crown className="w-8 h-8 text-accent" />
        </div>
      </section>
    </div>
  );
}
