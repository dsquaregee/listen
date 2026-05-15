import { Album } from '../types';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { memo } from 'react';

interface HeroProps {
  album: Album | null;
}

const Hero = memo(({ album }: HeroProps) => {
  if (!album) return null;

  return (
    <div className="relative h-[400px] flex-shrink-0 flex items-end p-6 sm:p-12 overflow-hidden shadow-2xl bg-dark">
      {/* Background Image with Gradient Overlays */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] scale-110"
        style={{ backgroundImage: `url(${album.coverUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/60 to-transparent" />
        <div className="absolute inset-0 cinematic-gradient" />
      </div>

      <div className="relative z-10 max-w-2xl px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-gold border border-gold/30">
            Featured Experience
          </span>

          <h1 className="text-3xl sm:text-6xl font-serif font-bold mb-4 leading-tight">
            {album.title}
          </h1>
          
          <p className="text-zinc-300 text-sm mb-6 max-w-lg leading-relaxed">
            {album.description}
          </p>

          <div className="flex flex-wrap gap-4">
            <Link 
              to={`/album/${album.id}`}
              className="bg-white text-black px-8 py-3 rounded-md font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors transform active:scale-95"
            >
              <Play fill="currentColor" size={20} />
              Preview Now
            </Link>
            
            <Link 
              to={`/album/${album.id}`}
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-md font-bold border border-white/20 transition-all backdrop-blur"
            >
              Buy Album — $5
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

Hero.displayName = 'Hero';

export default Hero;
