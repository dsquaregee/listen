import { Album } from '../types';
import AlbumCard from './AlbumCard';
import { motion } from 'motion/react';
import { memo } from 'react';

interface AlbumGridProps {
  title: string;
  subtitle?: string;
  albums: Album[];
  theme?: string;
}

const AlbumGrid = memo(({ title, subtitle, albums, theme }: AlbumGridProps) => {
  return (
    <section className="relative">
      {theme && (
        <div className={`absolute -inset-x-4 -inset-y-8 bg-gradient-to-b ${theme} rounded-3xl z-[-1] blur-xl opacity-50`} />
      )}
      
      <div className="flex justify-between items-end mb-6">
        <div className="flex items-center border-l-4 border-gold pl-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gold">{title}</h2>
        </div>
        <button className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
          View All
        </button>
      </div>

      <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {albums.map((album, idx) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="flex-shrink-0 w-[240px] sm:w-[280px]"
          >
            <AlbumCard album={album} />
          </motion.div>
        ))}
      </div>
    </section>
  );
});

AlbumGrid.displayName = 'AlbumGrid';

export default AlbumGrid;
