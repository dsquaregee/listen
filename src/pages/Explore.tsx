import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Play, Music } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, Album } from '../types';
import { MOCK_CATEGORIES, MOCK_ALBUMS } from '../data/mockData';
import { usePlayerStore } from '../store/usePlayerStore';
import { OptimizedImage } from '../components/OptimizedImage';
import { cn } from '../lib/utils';

export default function Explore() {
  const { setAlbum } = usePlayerStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [categories, setCategories] = useState<Category[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catSn = await getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')));
        const fetchedCats = catSn.empty ? MOCK_CATEGORIES : catSn.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        setCategories(fetchedCats);

        const albumSn = await getDocs(query(collection(db, 'albums'), orderBy('createdAt', 'desc')));
        const fetchedAlbums = albumSn.empty ? MOCK_ALBUMS : albumSn.docs.map(d => ({ id: d.id, ...d.data() } as Album));
        setAlbums(fetchedAlbums);
      } catch (e) {
        console.error(e);
        setCategories(MOCK_CATEGORIES);
        setAlbums(MOCK_ALBUMS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAlbums = albums.filter(album => {
    const matchesSearch = album.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         album.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || album.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="pt-32 flex justify-center h-screen bg-black">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pt-24 px-6 pb-20 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12">
        <h1 className="text-5xl font-serif font-bold italic text-white mb-4">Explore the <span className="text-primary">Cosmos</span></h1>
        <p className="text-white/40 uppercase tracking-[0.3em] text-[10px]">Filter the frequencies of your journey</p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-12">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search titles, souls..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary/40 transition-all text-white"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              !selectedCategory ? "bg-primary text-black" : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
          >
            All Universes
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                selectedCategory === cat.id ? "bg-primary text-black" : "bg-white/5 text-white/40 hover:bg-white/10"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {filteredAlbums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredAlbums.map((album, idx) => (
            <motion.div 
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx % 12) * 0.05 }}
              className="group cursor-pointer"
              onClick={() => setAlbum(album)}
            >
              <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-4 shadow-2xl group-hover:shadow-primary/10 transition-all">
                <OptimizedImage 
                  src={album.coverUrl} 
                  alt={album.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-12 h-12 text-white fill-current" />
                </div>
              </div>
              <h3 className="text-xl font-serif italic text-white group-hover:text-primary transition-colors truncate">{album.title}</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-white/30 mt-1">
                {categories.find(c => c.id === album.categoryId)?.name || 'Unknown Sector'}
              </p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center border-t border-white/5">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-10 h-10 text-white/10" />
          </div>
          <h3 className="text-xl font-serif font-bold italic text-white/40 mb-2">No vibrations found</h3>
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}
