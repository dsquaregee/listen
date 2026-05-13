import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Heart, Share2, Info, Music, Wind, 
  ChevronLeft, ListMusic, X, Maximize2, PlayCircle, FolderPlus, Check, Plus
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Album } from '../types';
import { MOCK_ALBUMS } from '../data/mockData';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUserStore } from '../store/useUserStore';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';
import { hapticFeedback } from '../lib/haptics';
import { HlsVideoPlayer } from '../components/HlsVideoPlayer';

export default function AlbumDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { playlists, addAlbumToPlaylist, favorites, toggleLike } = useUserStore();
  const [album, setAlbumData] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(null);
  const { setAlbum, currentAlbum, addToQueue } = usePlayerStore();

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const docRef = doc(db, 'albums', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAlbumData({ id: docSnap.id, ...docSnap.data() } as Album);
        } else {
          // Fallback to mock data for demo consistency
          const mock = MOCK_ALBUMS.find(a => a.id === id);
          if (mock) setAlbumData(mock);
        }
      } catch (error) {
        console.error("Error fetching album:", error);
        const mock = MOCK_ALBUMS.find(a => a.id === id);
        if (mock) setAlbumData(mock);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlbum();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!album) return <div className="min-h-screen pt-20 text-center">Album not found</div>;

  const isCurrent = currentAlbum?.id === album.id;
  
  const handleQueue = () => {
    addToQueue(album);
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Cinematic Header Cover */}
      <div 
        className={cn(
          "relative h-[50vh] sm:h-[60vh] overflow-hidden group",
          album.videoHlsUrl && "cursor-pointer"
        )}
        onClick={() => {
          if (album.videoHlsUrl) {
            hapticFeedback.light();
            setShowPreview(true);
          }
        }}
      >
        <div className="absolute inset-0 blur-3xl scale-110 opacity-50">
          <img src={album.coverUrl || undefined} alt="" className="w-full h-full object-cover" />
        </div>
        <img src={album.coverUrl || undefined} alt={album.title} className="relative w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        

        <Link to="/" className="absolute top-6 left-6 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-24 md:-mt-32 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end mb-12 text-center md:text-left">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative w-48 h-48 md:w-64 md:h-64 shrink-0 transition-transform hover:scale-105"
          >
            <div className="absolute inset-2 blur-xl opacity-30 bg-accent/20 rounded-3xl" />
            <div className="absolute -inset-4 blur-3xl opacity-20 bg-accent/10 rounded-full" />
            
            <div 
              className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 cursor-pointer group"
              onClick={() => {
                if (album.videoHlsUrl) {
                  hapticFeedback.light();
                  setShowPreview(true);
                }
              }}
            >
              <img src={album.coverUrl || undefined} alt={album.title} className="w-full h-full object-cover" />
              {album.videoHlsUrl && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-accent fill-current" />
                </div>
              )}
            </div>
          </motion.div>
          
          <div className="flex-1 pb-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center md:items-start"
            >
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white italic tracking-tight">{album.title}</h1>
                {album.tier === 'premium' && (
                  <span className="px-2 py-0.5 rounded bg-accent text-black text-[8px] font-black uppercase tracking-widest">Premium</span>
                )}
              </div>
              <p className="text-lg md:text-xl text-accent font-medium mb-6 uppercase tracking-[0.2em]">
                {album.tier === 'premium' ? 'Premium Experience' : 'Standard Journey'}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
                <button 
                  onClick={() => {
                    hapticFeedback.medium();
                    setAlbum(album);
                  }}
                  className="flex items-center justify-center gap-3 px-6 md:px-8 py-3 bg-accent text-black font-bold rounded-full hover:scale-105 transition-transform uppercase text-[10px] md:text-xs tracking-widest shadow-lg shadow-accent/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isCurrent ? 'Now Playing' : 'Start Journey'}
                </button>
                <button 
                  onClick={() => {
                    hapticFeedback.light();
                    handleQueue();
                  }}
                  className="flex items-center justify-center gap-3 px-6 md:px-8 py-3 bg-white/5 text-white font-bold rounded-full hover:bg-white/10 transition-all border border-white/10 uppercase text-[10px] md:text-xs tracking-widest"
                >
                  <ListMusic className="w-4 h-4" />
                  Queue Next
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      hapticFeedback.light();
                      toggleLike(album.id);
                    }}
                    className={cn(
                      "p-3 rounded-full bg-white/5 transition-all border border-white/10",
                      favorites.includes(album.id) ? "text-accent border-accent/30 bg-accent/5" : "text-white/40 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", favorites.includes(album.id) ? "fill-current" : "")} />
                  </button>
                  <button 
                    onClick={() => hapticFeedback.light()}
                    className="p-3 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      hapticFeedback.light();
                      if (!user) return alert('Please sign in to manage orbits.');
                      setShowPlaylistModal(true);
                    }}
                    className="p-3 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                    title="Add to Atmosphere"
                  >
                    <FolderPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Playlist Selection Modal */}
        <AnimatePresence>
          {showPlaylistModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPlaylistModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-lg font-serif font-bold italic text-white">Embed in Atmosphere</h3>
                  <button onClick={() => setShowPlaylistModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {playlists.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-white/40 mb-4">No atmospheres initialized yet.</p>
                      <Link 
                        to="/playlists" 
                        className="text-[10px] font-bold text-accent uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Create Atmosphere
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {playlists.map(pl => {
                        const isAdded = pl.albumIds.includes(album.id);
                        return (
                          <button
                            key={pl.id}
                            disabled={isAdded || addingToPlaylistId === pl.id}
                            onClick={async () => {
                              setAddingToPlaylistId(pl.id);
                              await addAlbumToPlaylist(pl.id, album.id);
                              setAddingToPlaylistId(null);
                              hapticFeedback.medium();
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                              isAdded ? "bg-accent/10 border border-accent/20" : "bg-white/5 hover:bg-white/10 border border-transparent"
                            )}
                          >
                            <div className="flex flex-col items-start gap-1">
                              <span className={cn("text-sm font-bold truncate", isAdded ? "text-accent" : "text-white")}>{pl.name}</span>
                              <span className="text-[10px] text-white/20 uppercase tracking-widest">{pl.albumIds.length} Experiences</span>
                            </div>
                            {isAdded ? (
                              <Check className="w-4 h-4 text-accent" />
                            ) : addingToPlaylistId === pl.id ? (
                              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 text-white/20 group-hover:text-accent transition-colors" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white/[0.02]">
                   <Link 
                    to="/playlists" 
                    className="flex items-center justify-center gap-2 w-full py-3 text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors"
                  >
                    <ListMusic className="w-4 h-4" />
                    Manage Soundscapes
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Info Grid */}
        <div className="mb-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-serif font-bold text-white mb-6 italic">
              Experience Insight
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg mb-8 italic">
              {album.description}
            </p>
          </div>
        </div>

        {/* Related Albums */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-white mb-8">Continue your Journey</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {MOCK_ALBUMS.filter(a => a.id !== id).slice(0, 2).map((a) => (
              <Link to={`/album/${a.id}`} key={a.id} className="group flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={a.coverUrl || undefined} alt={a.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                  <h4 className="text-white font-medium truncate">{a.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
