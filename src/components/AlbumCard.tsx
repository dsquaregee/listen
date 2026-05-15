import { Album } from '../types';
import { Link } from 'react-router-dom';
import { Play, ShoppingBag, ListPlus, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, memo, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import ShareModal from './ShareModal';

interface AlbumCardProps {
  album: Album;
  isOwned?: boolean;
}

const AlbumCard = memo(({ album, isOwned = false }: AlbumCardProps) => {
  const { profile } = useAuth();
  const { playTrack, addToQueue } = usePlayer();
  const [showShareModal, setShowShareModal] = useState(false);

  const handleBuy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); // Important: Stop the Link navigation
    e.stopPropagation();

    if (!profile) {
      toast.error("Please sign in to purchase");
      return;
    }

    toast.info("Redirecting to secure checkout...");
    
    // Simulate checkout initiation
    setTimeout(() => {
      // In a real app, we'd hit the API then redirect to Stripe
      // For this demo, we'll go to the success page
      window.location.href = `/success?album_id=${album.id}`;
    }, 1500);
  }, [profile, album.id]);

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playTrack({
      id: album.id,
      title: album.title,
      url: isOwned ? album.fullUrl : album.previewUrl,
      coverUrl: album.coverUrl,
      isPreview: !isOwned
    });
  }, [album, isOwned, playTrack]);

  const handleQueueClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToQueue({
      id: album.id,
      title: album.title,
      url: isOwned ? album.fullUrl : album.previewUrl,
      coverUrl: album.coverUrl,
      isPreview: !isOwned
    });
    toast.success("Added to sequence");
  }, [album, isOwned, addToQueue]);

  return (
    <div className="relative">
      <Link to={`/album/${album.id}`} className="group block relative">
        <motion.div 
          className="cinematic-card aspect-[4/3] mb-4 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.img 
            src={album.coverUrl} 
            alt={album.title} 
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            initial={false}
            whileHover={{ scale: 1.15, opacity: 0.8 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* Play/Queue Overlay on Hover */}
          <div className="absolute inset-x-0 top-0 p-3 flex justify-end gap-2 z-20">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors shadow-lg opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-[-10px] sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transform duration-300"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowShareModal(true);
              }}
              title="Share"
            >
              <Share2 size={18} />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-gold transition-colors shadow-lg opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-[-10px] sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transform duration-300 delay-75"
              onClick={handlePlayClick}
              title="Play Preview"
            >
              <Play size={18} fill="currentColor" className="ml-1" />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors shadow-lg opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-[-10px] sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transform duration-300 delay-150"
              onClick={handleQueueClick}
              title="Add to Queue"
            >
              <ListPlus size={18} />
            </motion.button>
          </div>

          {/* Buy Overlay on Hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
            <motion.button 
              onClick={handleBuy}
              whileHover={{ scale: 1.05, backgroundColor: "#fff" }}
              whileTap={{ scale: 0.95 }}
              className="bg-gold text-black px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transform translate-y-0 sm:translate-y-4 sm:group-hover:translate-y-0 transition-all duration-500 shadow-2xl opacity-100 sm:opacity-100"
            >
              <ShoppingBag size={14} />
              Buy Now
            </motion.button>
          </div>

          {/* Cinematic Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end pointer-events-none">
            <p className="font-bold text-sm group-hover:text-gold transition-colors truncate">{album.title}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{album.duration} • {album.moodTags[0]}</p>
          </div>

          {/* Featured Badge */}
          {album.isFeatured && (
            <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-sm border border-gold/30 text-gold text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase z-20">
              Featured
            </div>
          )}
        </motion.div>

        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-gold/60 transition-colors">Digital Journey</span>
          <span className="text-[10px] font-mono font-bold text-gold">$5.00</span>
        </div>
      </Link>

      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        title={album.title}
        url={window.location.origin + `/album/${album.id}`}
      />
    </div>
  );
});

AlbumCard.displayName = 'AlbumCard';

export default AlbumCard;
