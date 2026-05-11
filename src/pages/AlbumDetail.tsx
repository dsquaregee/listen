import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Heart, Share2, Info, Music, Wind, 
  Clock, ChevronLeft, ListMusic, X, Maximize2, PlayCircle
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Album } from '../types';
import { MOCK_ALBUMS } from '../data/mockData';
import { usePlayerStore } from '../store/usePlayerStore';
import { formatTime, cn } from '../lib/utils';
import { hapticFeedback } from '../lib/haptics';
import { HlsVideoPlayer } from '../components/HlsVideoPlayer';

export default function AlbumDetail() {
  const { id } = useParams();
  const [album, setAlbumData] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
        
        {album.videoHlsUrl && (
          <button 
            onClick={() => {
              hapticFeedback.light();
              setShowPreview(true);
            }}
            className="absolute bottom-32 right-8 z-20 flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          >
            <Maximize2 className="w-4 h-4 text-primary" />
            Watch Preview
          </button>
        )}

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
            <div className="absolute inset-2 blur-xl opacity-30 bg-primary/20 rounded-3xl" />
            <div className="absolute -inset-4 blur-3xl opacity-20 bg-primary/10 rounded-full" />
            
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
                  <Play className="w-12 h-12 text-primary fill-current" />
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
                  <span className="px-2 py-0.5 rounded bg-primary text-black text-[8px] font-black uppercase tracking-widest">Premium</span>
                )}
              </div>
              <p className="text-lg md:text-xl text-primary font-medium mb-6 uppercase tracking-[0.2em]">
                {album.tier === 'premium' ? 'Premium Experience' : 'Standard Journey'}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
                <button 
                  onClick={() => {
                    hapticFeedback.medium();
                    setAlbum(album);
                  }}
                  className="flex items-center justify-center gap-3 px-6 md:px-8 py-3 bg-primary text-black font-bold rounded-full hover:scale-105 transition-transform uppercase text-[10px] md:text-xs tracking-widest shadow-lg shadow-primary/20"
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
                    onClick={() => hapticFeedback.light()}
                    className="p-3 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => hapticFeedback.light()}
                    className="p-3 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="mb-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-serif font-bold text-white mb-6 italic">
              Experience Insight
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg mb-8 italic">
              {album.description}
            </p>

            <div className="flex justify-center gap-12">
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-[0.3em] text-primary/40 font-bold block mb-2">Duration</span>
                <div className="flex items-center gap-2 text-white font-mono text-xl justify-center">
                  {formatTime(album.duration)}
                </div>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-[0.3em] text-primary/40 font-bold block mb-2">Universe</span>
                <div className="flex items-center gap-2 text-white font-mono text-xl justify-center">
                  {album.tier === 'premium' ? 'Gold' : 'Silver'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cinematic Shorts Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-serif font-bold text-white mb-8">Cinematic Shorts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {album.videoHlsUrl ? (
              <div 
                className="aspect-[9/16] rounded-2xl bg-slate-900 overflow-hidden relative group cursor-pointer border border-white/5 ring-1 ring-white/5 shadow-2xl"
                onClick={() => {
                  hapticFeedback.light();
                  setShowPreview(true);
                }}
              >
                <HlsVideoPlayer 
                  src={album.videoHlsUrl}
                  autoplay
                  loop
                  muted
                  controls={false}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Maximize2 className="w-12 h-12 text-white bg-black/40 backdrop-blur-md rounded-full p-2" />
                </div>
                <div className="absolute bottom-4 left-4 z-20">
                  <p className="text-white text-[10px] font-bold uppercase tracking-widest">AI Preview Clip</p>
                </div>
              </div>
            ) : (
              [1, 2, 3].map((clip) => (
                <div key={clip} className="aspect-[9/16] rounded-2xl bg-slate-900 overflow-hidden relative group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Play className="w-12 h-12 text-white bg-black/40 backdrop-blur-md rounded-full p-2" />
                  </div>
                  <div className="absolute bottom-4 left-4 z-20">
                    <p className="text-white text-xs font-medium">Moment {clip}</p>
                  </div>
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <Music className="w-8 h-8 text-white/10" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Video Preview Modal */}
        <AnimatePresence>
          {showPreview && album.videoHlsUrl && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl px-4"
              onClick={() => setShowPreview(false)}
            >
              <button 
                onClick={() => setShowPreview(false)}
                className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/10 text-white z-[110] hover:bg-white/10 transition-all hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>

              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg aspect-[9/16] rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(244,196,48,0.2)] border border-white/10"
                onClick={e => e.stopPropagation()}
              >
              <HlsVideoPlayer 
                src={album.videoHlsUrl}
                autoplay
                className="w-full h-full object-cover"
              />
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none">
                  <h3 className="text-2xl font-serif font-bold italic text-white mb-2">{album.title}</h3>
                  <p className="text-primary text-sm uppercase tracking-widest mb-4 font-bold">{album.artist} • Preview</p>
                  <p className="text-white/60 text-xs leading-relaxed italic">{album.description}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <p className="text-[10px] text-primary/40 uppercase tracking-widest">{formatTime(a.duration)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
