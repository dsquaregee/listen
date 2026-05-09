import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Play, Heart, Share2, Info, Music, Wind, Clock, ChevronLeft, ListMusic } from 'lucide-react';
import { MOCK_ALBUMS } from '../data/mockData';
import { usePlayerStore } from '../store/usePlayerStore';
import { formatTime, cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function AlbumDetail() {
  const { id } = useParams();
  const album = MOCK_ALBUMS.find(a => a.id === id) || MOCK_ALBUMS[0];
  const { setAlbum, currentAlbum, addToQueue } = usePlayerStore();

  const isCurrent = currentAlbum?.id === album.id;
  
  const handleQueue = () => {
    addToQueue(album);
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Cinematic Header Cover */}
      <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        {/* Background Blur Layer */}
        <div className="absolute inset-0 blur-3xl scale-110 opacity-50">
          <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
        </div>
        <img src={album.coverUrl} alt={album.title} className="relative w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <Link to="/" className="absolute top-6 left-6 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-6 -mt-32 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8 items-end mb-12">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative w-64 h-64 shrink-0"
          >
            {/* Cinematic Shadow/Blur */}
            <div className="absolute inset-2 blur-xl opacity-30 bg-primary/20 rounded-3xl" />
            <div className="absolute -inset-4 blur-3xl opacity-20 bg-primary/10 rounded-full" />
            
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
            </div>
          </motion.div>
          
          <div className="flex-1 pb-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-2 italic tracking-tight">{album.title}</h1>
              <p className="text-xl text-primary font-medium mb-6 uppercase tracking-[0.2em]">{album.artist}</p>
              
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => setAlbum(album)}
                  className="flex items-center gap-3 px-8 py-3 bg-primary text-black font-bold rounded-full hover:scale-105 transition-transform uppercase text-xs tracking-widest shadow-lg shadow-primary/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isCurrent ? 'Now Playing' : 'Start Journey'}
                </button>
                <button 
                  onClick={handleQueue}
                  className="flex items-center gap-3 px-8 py-3 bg-white/5 text-white font-bold rounded-full hover:bg-white/10 transition-all border border-white/10 uppercase text-xs tracking-widest"
                >
                  <ListMusic className="w-4 h-4" />
                  Queue Next
                </button>
                <button className="p-3 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="md:col-span-2">
            <h2 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              About this Experience
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg mb-8">
              {album.description} This 1-hour immersive session is crafted to guide you through a deep cinematic landscape, blending traditional Carnatic structures with modern atmospheric textures.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold block mb-2">Duration</span>
                <div className="flex items-center gap-2 text-white font-mono text-xl">
                  <Clock className="w-5 h-5 text-white/40" />
                  {formatTime(album.duration)}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold block mb-2">BPM Range</span>
                <div className="flex items-center gap-2 text-white font-mono text-xl">
                  <Wind className="w-5 h-5 text-white/40" />
                  {album.bpm || 'Variable'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-serif font-bold text-white mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Instruments
              </h2>
              <div className="flex flex-wrap gap-2">
                {album.instruments.map(inst => (
                  <span key={inst} className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium border border-white/5">
                    {inst}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-serif font-bold text-white mb-4">Mood Palette</h2>
              <div className="flex flex-wrap gap-2">
                {album.moodTags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-tighter border border-primary/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reels / Short Clips Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-serif font-bold text-white mb-8">Cinematic Shorts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((clip) => (
              <div key={clip} className="aspect-[9/16] rounded-2xl bg-slate-900 overflow-hidden relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Play className="w-12 h-12 text-white bg-black/40 backdrop-blur-md rounded-full p-2" />
                </div>
                <div className="absolute bottom-4 left-4 z-20">
                  <p className="text-white text-xs font-medium">Moment {clip}</p>
                </div>
                {/* Fallback pattern for video */}
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <Music className="w-8 h-8 text-white/10" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Albums */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-white mb-8">Continue your Journey</h2>
          <div className="grid grid-cols-2 gap-6">
            {MOCK_ALBUMS.filter(a => a.id !== id).slice(0, 2).map((a) => (
              <Link to={`/album/${a.id}`} key={a.id} className="group flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={a.coverUrl} alt={a.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                  <h4 className="text-white font-medium truncate">{a.title}</h4>
                  <p className="text-slate-400 text-sm">{a.artist}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
