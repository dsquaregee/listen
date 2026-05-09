import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Library, Home, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { MOCK_ALBUMS } from '../data/mockData';
import { Album } from '../types';
import logo from '../logo.png';
import { OptimizedImage } from './OptimizedImage';

export default function Navbar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<Album[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = MOCK_ALBUMS.filter(album => 
      album.title.toLowerCase().includes(query) ||
      album.artist.toLowerCase().includes(query) ||
      album.moodTags.some(tag => tag.toLowerCase().includes(query)) ||
      album.instruments.some(inst => inst.toLowerCase().includes(query))
    );
    setResults(filtered);
  }, [searchQuery]);

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
    <nav className="h-16 flex items-center justify-between px-8 z-20 sticky top-0 bg-[#080808]/80 backdrop-blur-md border-b border-white/5">
    <div className="flex items-center gap-4">
      <Link to="/" className="flex items-center gap-3">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-[#F4C430] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative w-12 h-12 bg-[#111] rounded-full flex items-center justify-center border border-[#D4AF37]/20 overflow-hidden shadow-2xl">
            <img 
              src={logo}
              alt="DsquareGee Logo" 
              className="w-full h-full object-cover scale-110"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-serif font-bold italic tracking-tighter text-white leading-none">DsquareGee</span>
          <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-[#F4C430] leading-none mt-1 opacity-60">Seeker of Sounds</span>
        </div>
      </Link>
    </div>
    <div className="flex items-center gap-8">
      {/* Search Universe Input */}
      <div ref={searchRef} className="relative">
        <div 
          className={cn(
            "flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 transition-all duration-300 group",
            isFocused ? "w-64 bg-white/10 border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20" : "w-48"
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
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] px-3 py-2">Discoveries</p>
                    {results.map((album) => (
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
                          <p className="text-[10px] text-white/40 truncate">{album.artist}</p>
                          <div className="flex gap-1 mt-1">
                            {album.moodTags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[8px] text-white/20 italic">#{tag}</span>
                            ))}
                          </div>
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
      
      <div className="hidden md:flex items-center gap-6 mr-4">
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

      <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/30 p-0.5 overflow-hidden active:scale-95 transition-transform">
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
