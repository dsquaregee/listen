import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Library, Home, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { MOCK_ALBUMS } from '../data/mockData';
import { Album } from '../types';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OptimizedImage } from './OptimizedImage';

const logoUrl = '/pwa-512x512.png';

export default function Navbar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<Album[]>([]);
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch all albums for local search efficiency
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const sn = await getDocs(collection(db, 'albums'));
        const albums = sn.empty 
          ? MOCK_ALBUMS 
          : sn.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
        setAllAlbums(albums);
      } catch (e) {
        console.error('Failed to fetch albums for search:', e);
        setAllAlbums(MOCK_ALBUMS);
      }
    };
    fetchAlbums();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery.trim() === '') {
      setResults([]);
      return;
    }

    const queryStr = debouncedSearchQuery.toLowerCase().trim();
    
    // Prioritized filtering and sorting
    const scoredResults = allAlbums.map(album => {
      let score = 0;
      const title = album.title.toLowerCase();
      const artist = album.artist.toLowerCase();

      // 1. Exact Match (Highest Priority)
      if (title === queryStr) score += 1000;
      if (artist === queryStr) score += 800;

      // 2. Starts With Match
      if (title.startsWith(queryStr)) score += 500;
      if (artist.startsWith(queryStr)) score += 400;

      // 3. Includes Match (Standard)
      if (title.includes(queryStr)) score += 100;
      if (artist.includes(queryStr)) score += 80;

      // 4. Tag/Instrument Match (Lower Priority)
      if (album.moodTags?.some(tag => tag.toLowerCase().includes(queryStr))) score += 20;
      if (album.instruments?.some(inst => inst.toLowerCase().includes(queryStr))) score += 10;

      return { album, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.album);

    setResults(scoredResults);
  }, [debouncedSearchQuery, allAlbums]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (albumId: string) => {
    navigate(`/album/${albumId}`);
    setIsFocused(false);
    setSearchQuery('');
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Library', path: '/library', icon: Library },
  ];

  return (
    <nav className="h-16 flex items-center justify-between px-4 md:px-8 z-20 sticky top-0 bg-[#080808]/80 backdrop-blur-md border-b border-white/5">
    <div className="flex items-center gap-2 md:gap-4 shrink-0">
      <Link to="/" className="flex items-center gap-2 md:gap-3">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-[#F4C430] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative w-10 h-10 md:w-12 md:h-12 bg-[#111] rounded-full flex items-center justify-center border border-[#D4AF37]/20 overflow-hidden shadow-2xl">
            <img 
              src={logoUrl}
              alt="DsquareGee Logo" 
              className="w-full h-full object-cover scale-110"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-lg md:text-xl font-serif font-bold italic tracking-tighter text-white leading-none">DsquareGee</span>
          <span className="text-[6px] md:text-[7px] font-bold uppercase tracking-[0.4em] text-[#F4C430] leading-none mt-1 opacity-60">Seeker of Sounds</span>
        </div>
      </Link>
    </div>
    <div className="flex items-center gap-3 md:gap-8 flex-1 justify-end">
      {/* Search Universe Input */}
      <div ref={searchRef} className="relative flex-1 max-w-[256px]">
        <div 
          className={cn(
            "flex items-center gap-2 bg-white/5 px-3 md:px-4 py-1.5 rounded-full border border-white/10 transition-all duration-300 group",
            isFocused ? "w-full bg-white/10 border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20" : "w-full md:w-48 ml-auto"
          )}
        >
          <Search className={cn("w-4 h-4 transition-colors", isFocused ? "text-[#F4C430]" : "text-[#D4AF37]")} />
          <input
            type="text"
            placeholder="Search Universe"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="bg-transparent border-none outline-none text-[10px] font-medium text-white placeholder:text-white/40 uppercase tracking-widest w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {isFocused && (searchQuery || results.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full mt-3 right-0 w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] backdrop-blur-xl"
            >
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {results.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {/* Top Result Highlight */}
                    {results.length > 0 && searchQuery.length > 2 && (
                      <div className="mb-2 px-1">
                        <p className="text-[9px] font-bold text-[#F4C430] uppercase tracking-[0.2em] px-2 mb-2">Top Discovery</p>
                        <button
                          onClick={() => handleResultClick(results[0].id)}
                          className="w-full flex flex-col gap-3 p-3 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 hover:border-primary/40 transition-all group relative overflow-hidden"
                        >
                          <div className="flex items-center gap-4 relative z-10">
                            <OptimizedImage 
                              src={results[0].coverUrl} 
                              alt={results[0].title}
                              className="w-16 h-16 rounded-xl shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{results[0].title}</h4>
                              <p className="text-xs text-white/40 truncate">{results[0].artist}</p>
                              <p className="text-[10px] text-white/30 line-clamp-2 italic mt-1 leading-relaxed">{results[0].description}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-bold uppercase tracking-widest">
                                  Best Match
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Decorative Background Element */}
                          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                        </button>
                      </div>
                    )}

                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] px-3 py-2">
                      {searchQuery.length > 2 && results.length > 1 ? 'Other Matches' : 'Discoveries'}
                    </p>
                    {results.slice(searchQuery.length > 2 ? 1 : 0).map((album) => (
                      <button
                        key={album.id}
                        onClick={() => handleResultClick(album.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group text-left"
                      >
                        <OptimizedImage 
                          src={album.coverUrl} 
                          alt={album.title}
                          className="w-10 h-10 rounded-lg shrink-0 border border-white/5 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#F4C430] transition-colors">{album.title}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-white/40 truncate">{album.artist}</p>
                            <span className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                            <div className="flex gap-1 overflow-hidden">
                              {album.moodTags.slice(0, 1).map(tag => (
                                <span key={tag} className="text-[8px] text-white/20 italic">#{tag}</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-[9px] text-white/30 line-clamp-1 italic mt-0.5">{album.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-5 h-5 text-white/20" />
                    </div>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest">No sound signatures found</p>
                  </div>
                ) : (
                  <div className="p-4">
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] px-2 mb-2">Popular Explorations</p>
                    <div className="grid grid-cols-2 gap-2">
                      {MOCK_ALBUMS.slice(0, 4).map(album => (
                        <button
                          key={album.id}
                          onClick={() => handleResultClick(album.id)}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-all text-left group"
                        >
                           <OptimizedImage 
                             src={album.coverUrl} 
                             alt={album.title}
                             className="w-6 h-6 rounded bg-white/5 group-hover:scale-110 transition-transform"
                           />
                           <span className="text-[9px] text-white/60 truncate uppercase font-bold tracking-tighter group-hover:text-white transition-colors">{album.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="hidden md:flex items-center gap-6">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em] transition-colors hover:text-primary",
              location.pathname === item.path ? "text-primary" : "text-white/40"
            )}
          >
            {item.name}
          </Link>
        ))}
        {user?.isAdmin && (
          <Link 
            to="/admin"
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em] transition-colors px-3 py-1 rounded-full border border-white/10 hover:bg-white/5",
              location.pathname === '/admin' ? "text-primary border-primary/20 bg-primary/5" : "text-white/40"
            )}
          >
            Admin
          </Link>
        )}
      </div>

      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#D4AF37]/30 p-0.5 shrink-0 overflow-hidden active:scale-95 transition-transform">
        <Link to="/profile" className="w-full h-full bg-[#222] rounded-full flex items-center justify-center overflow-hidden">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-[#D4AF37]">
              {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'Guest'}
            </span>
          )}
        </Link>
      </div>
    </div>
  </nav>
  );
}
