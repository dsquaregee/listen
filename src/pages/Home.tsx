// src/pages/Home.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, TrendingUp, ChevronRight, Crown } from 'lucide-react';
import { MOCK_CATEGORIES, MOCK_ALBUMS } from '../data/mockData';
import { usePlayerStore } from '../store/usePlayerStore';
import { Link } from 'react-router-dom';
import { cn, formatTime } from '../lib/utils';
import { OptimizedImage } from '../components/OptimizedImage';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, Album } from '../types';

export default function Home() {
  const { setAlbum, recentlyPlayed } = usePlayerStore();
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
    acc[cat.id] = albums.filter(album => album.categoryId === cat.id);
    return acc;
  }, {} as Record<string, Album[]>);

  return (
    <div className="pt-16 px-4 pb-20 overflow-x-hidden min-h-screen">
      {/* Hero Banner - Cinematic Focus */}
      <motion.section 
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative h-[60vh] sm:h-[70vh] rounded-3xl overflow-hidden mb-16 group shadow-2xl mx-auto max-w-7xl"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />
        <OptimizedImage 
          src={featured.coverUrl} 
          alt={featured.title} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 group-hover:scale-110 opacity-80" 
        />
        
        <div className="relative z-20 h-full flex flex-col justify-end p-8 sm:p-16 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="flex gap-2 items-center mb-6">
              <span className="bg-primary text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                Featured Experience
              </span>
              {featured.tier === 'premium' && (
                <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/20 flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-primary" /> Premium
                </span>
              )}
            </div>
            <h1 className="text-6xl sm:text-8xl font-serif italic text-white leading-[0.9] mb-6 drop-shadow-2xl">
              {featured.title}
            </h1>
            <p className="text-base sm:text-lg text-white/60 mt-2 line-clamp-2 leading-relaxed max-w-xl mb-10 font-light italic">
              {featured.description}
            </p>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setAlbum(featured)}
                className="bg-white text-black px-10 py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary transition-colors shadow-lg active:scale-95 duration-200"
              >
                Immerse Now
              </button>
              <Link 
                to={`/album/${featured.id}`}
                className="group flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest">Learn More</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Categories with Horizontal Albums */}
      <div className="max-w-7xl mx-auto space-y-20">
        {categories.map((cat, catIdx) => (
          <motion.section 
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: catIdx * 0.1, duration: 0.8 }}
            className="px-4"
          >
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif italic text-white mb-2">{cat.name}</h2>
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/30">{cat.description}</p>
              </div>
              <Link 
                to={`/category/${cat.slug}`}
                className="text-[10px] text-primary uppercase font-bold tracking-widest hover:underline mb-2"
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
                    <div className="relative aspect-[4/5] bg-[#1a1a1a] rounded-[2rem] overflow-hidden mb-6 border border-white/5 shadow-2xl transition-all duration-500 group-hover:shadow-primary/10">
                      <OptimizedImage 
                        src={album.coverUrl} 
                        alt={album.title} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      
                      {album.tier === 'premium' && (
                        <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-primary border border-white/10">
                          <Crown className="w-3 h-3" />
                        </div>
                      )}
                      
                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl">
                          <Play className="w-4 h-4 text-black fill-current" />
                        </div>
                        <span className="text-[10px] font-mono text-white/60 bg-black/40 backdrop-blur-md px-2 py-1 rounded">
                          {formatTime(album.duration)}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-serif italic text-white group-hover:text-primary transition-colors mb-2 truncate">
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

      {/* Trending / Global - Sophisticated Footer section */}
      <section className="mt-32 max-w-7xl mx-auto px-4 mb-20 text-center">
        <div className="h-px w-24 bg-primary mx-auto mb-12 opacity-30" />
        <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20 mb-8">Harmonizing the Future</h2>
        <div className="flex flex-wrap justify-center gap-12 sm:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
          <TrendingUp className="w-8 h-8" />
          <Play className="w-8 h-8" />
          <Crown className="w-8 h-8" />
        </div>
      </section>
    </div>
  );
}
