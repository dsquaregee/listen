import { Link, useLocation } from 'react-router-dom';
import { Play, Search, User, Crown, Library, Home } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import logo from '../logo.png';

export default function Navbar() {
  const { user } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Library', path: '/library', icon: Library },
    { name: 'Search', path: '/search', icon: Search },
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
      <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 group cursor-pointer">
        <Search className="w-4 h-4 text-[#D4AF37]" />
        <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Search Universe</span>
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
