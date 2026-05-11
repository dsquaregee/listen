import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_CATEGORIES, MOCK_ALBUMS } from '../data/mockData';
import { Play, ChevronLeft, Loader2 } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, Album } from '../types';

export default function CategoryExplore() {
  const { slug } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setAlbum } = usePlayerStore();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Try Firestore first
        const q = query(collection(db, 'categories'), where('slug', '==', slug));
        const sn = await getDocs(q);
        
        let activeCat: Category | undefined;
        if (!sn.empty) {
          activeCat = { id: sn.docs[0].id, ...sn.docs[0].data() } as Category;
        } else {
          // Fallback to mock
          activeCat = MOCK_CATEGORIES.find(c => c.slug === slug);
        }

        if (activeCat) {
          setCategory(activeCat);
          // Fetch albums for this category from Firestore
          const albumsQ = query(
            collection(db, 'albums'), 
            where('categoryId', '==', activeCat.id)
          );
          const albumsSn = await getDocs(albumsQ);
          if (!albumsSn.empty) {
            setAlbums(albumsSn.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album)));
          } else {
             // Fallback to mock filtering
            setAlbums(MOCK_ALBUMS.filter(a => a.categoryId === activeCat?.id));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (isLoading) return (
    <div className="pt-32 flex justify-center h-screen bg-black">
      <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
    </div>
  );

  if (!category) return (
    <div className="pt-32 text-center h-screen bg-black text-white/40">
      Category not found
    </div>
  );

  return (
    <div className="pt-24 px-6 min-h-screen bg-black text-white">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold italic">{category.name}</h1>
          <p className="text-white/40 text-xs uppercase tracking-widest mt-1">{category.description}</p>
        </div>
      </div>

      <div className={cn("inline-block px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white mb-8", category.visualIdentity)}>
        Universe Active
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {albums.map((album) => (
          <motion.div 
            key={album.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group cursor-pointer"
            onClick={() => setAlbum(album)}
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-2xl">
              <img src={album.coverUrl || undefined} alt={album.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-12 h-12 text-white fill-current" />
              </div>
            </div>
            <h3 className="text-xl font-serif italic text-white group-hover:text-primary transition-colors">{album.title}</h3>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1 font-mono italic">
              {album.tier === 'premium' ? 'Premium Experience' : 'Standard journey'}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

