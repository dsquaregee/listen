import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Play, Music, ChevronLeft, Trash2, 
  MoreVertical, Share2, ListPlus, FolderPlus
} from 'lucide-react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/useUserStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { MOCK_ALBUMS } from '../data/mockData';
import { cn } from '../lib/utils';
import { hapticFeedback } from '../lib/haptics';
import { Album } from '../types';

export default function PlaylistDetail() {
  const { id } = useParams();
  const { playlists, removeAlbumFromPlaylist } = useUserStore();
  const { setAlbum, play, addToQueue } = usePlayerStore();
  
  const playlist = playlists.find(p => p.id === id);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylistAlbums = async () => {
      if (playlist && playlist.albumIds.length > 0) {
        setIsLoading(true);
        try {
          // Fetch all albums from Firestore (usually short list for this app)
          const albumSn = await getDocs(query(collection(db, 'albums')));
          const firestoreAlbums = albumSn.docs.map(d => ({ id: d.id, ...d.data() } as Album));
          
          // Combine with mock albums as fallback
          const allAvailableAlbums = [...firestoreAlbums, ...MOCK_ALBUMS];
          
          // Map IDs to actual album objects
          const filtered = playlist.albumIds.map(aid => 
            allAvailableAlbums.find(a => a.id === aid)
          ).filter((a): a is Album => !!a);
          
          setAlbums(filtered);
        } catch (error) {
          console.error("Error fetching playlist albums:", error);
          // Fallback to mock only if Firestore fails
          const filtered = playlist.albumIds.map(aid => 
            MOCK_ALBUMS.find(a => a.id === aid)
          ).filter((a): a is Album => !!a);
          setAlbums(filtered);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAlbums([]);
        setIsLoading(false);
      }
    };

    fetchPlaylistAlbums();
  }, [playlist]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen pt-32 px-6 flex flex-col items-center">
        <h2 className="text-2xl font-serif font-bold italic text-white mb-4">Atmosphere Not Found</h2>
        <Link to="/playlists" className="text-primary hover:underline font-bold uppercase tracking-widest text-[10px]">
          Return to All Sectors
        </Link>
      </div>
    );
  }

  const handlePlayPlaylist = () => {
    if (albums.length > 0) {
      hapticFeedback.medium();
      // Logic to play the whole playlist could be: play first, then queue rest
      setAlbum(albums[0]);
      setTimeout(() => {
        albums.slice(1).forEach(a => addToQueue(a));
      }, 100);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-32 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row gap-8 items-start md:items-end mb-16">
        <Link 
          to="/playlists" 
          className="p-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>

        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Sector Detail</span>
            </div>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold italic text-white leading-tight mb-4">{playlist.name}</h1>
          <div className="flex items-center gap-4 text-white/40 text-[10px] uppercase font-bold tracking-widest">
            <span>{albums.length} Embedded Experiences</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Sonic Atmosphere</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handlePlayPlaylist}
            disabled={albums.length === 0}
            className="flex items-center gap-3 px-8 py-3 bg-primary text-black rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            Initialize Sector
          </button>
        </div>
      </header>

      {/* Album List */}
      <div className="grid grid-cols-1 gap-4">
        {albums.map((album, index) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative flex items-center gap-6 p-4 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-primary/20 hover:bg-white/[0.02] transition-all"
          >
            <div className="text-[10px] font-mono text-white/10 w-6 text-center group-hover:text-primary transition-colors">
              {(index + 1).toString().padStart(2, '0')}
            </div>

            <div 
              className="relative w-16 h-16 rounded-2xl overflow-hidden cursor-pointer shrink-0"
              onClick={() => {
                hapticFeedback.light();
                setAlbum(album);
              }}
            >
              <img src={album.coverUrl || undefined} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-6 h-6 text-white fill-current" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate">{album.title}</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{album.artist}</p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  hapticFeedback.light();
                  addToQueue(album);
                }}
                className="p-3 bg-white/5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                title="Add to queue"
              >
                <ListPlus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  hapticFeedback.medium();
                  removeAlbumFromPlaylist(playlist.id, album.id);
                }}
                className="p-3 bg-white/5 rounded-full text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Remove from atmosphere"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {albums.length === 0 && (
          <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-xl font-serif font-bold italic text-white/40 mb-2">Atmosphere Vacant</h3>
            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">Navigate to albums to populate this sector</p>
            <Link 
              to="/explore" 
              className="mt-8 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
            >
              Discover Experiences
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
