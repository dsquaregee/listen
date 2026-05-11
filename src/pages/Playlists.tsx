import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ListMusic, Music, Trash2, ChevronRight, Sparkles, FolderPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '../components/OptimizedImage';

export default function Playlists() {
  const { user } = useAuthStore();
  const { playlists, createPlaylist, deletePlaylist } = useUserStore();
  const { setAlbum, play } = usePlayerStore();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlaylistName.trim()) return;
    await createPlaylist(user.uid, newPlaylistName);
    setNewPlaylistName('');
    setIsCreating(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ListMusic className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-serif font-bold italic text-white mb-4">Authentication Required</h2>
          <p className="text-white/40 text-sm mb-8">Sign in to preserve your sonic signatures and curate personal soundscapes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Curated Collection</span>
          </motion.div>
          <h1 className="text-5xl font-serif font-bold italic text-white leading-tight">
            Your Sonic <br />
            <span className="text-primary italic">Atmospheres</span>
          </h1>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Initialize New Sector
        </button>
      </header>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
            <form onSubmit={handleCreate} className="flex gap-4 p-6 bg-white/5 rounded-3xl border border-white/10 max-w-xl">
              <input
                autoFocus
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                placeholder="Atmosphere name (e.g. Midnight Raga Meditation)..."
                className="flex-1 bg-transparent border-b border-white/10 px-2 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-[10px] uppercase font-bold text-white/40 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-6 py-2 bg-primary text-black rounded-full text-[10px] uppercase font-bold tracking-widest disabled:opacity-50"
              >
                Initialize
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {playlists.map((pl, i) => (
          <motion.div
            key={pl.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-[#0a0a0a] rounded-[32px] p-6 border border-white/5 hover:border-primary/20 transition-all duration-500 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors">
                  <FolderPlus className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm('Dissolve this sector?')) deletePlaylist(pl.id);
                  }}
                  className="p-3 bg-white/5 rounded-full text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-serif font-bold italic text-white mb-2 group-hover:text-primary transition-colors">{pl.name}</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-8">{pl.albumIds.length} Embedded Experiences</p>

              <div className="mt-auto flex items-center justify-between">
                <div className="flex -space-x-4">
                  {pl.albumIds.slice(0, 3).map((id, idx) => (
                    <div 
                      key={id} 
                      className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-neutral-900 overflow-hidden shadow-xl"
                      style={{ zIndex: 3 - idx }}
                    >
                      <div className="w-full h-full animate-pulse bg-white/5" />
                    </div>
                  ))}
                  {pl.albumIds.length > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-neutral-900 flex items-center justify-center z-0">
                      <span className="text-[8px] font-bold text-white/40">+{pl.albumIds.length - 3}</span>
                    </div>
                  )}
                </div>

                <Link 
                  to={`/playlist/${pl.id}`}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 group-hover:bg-primary group-hover:text-black transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}

        {playlists.length === 0 && !isCreating && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-xl font-serif font-bold italic text-white/40 mb-2">The Silence is Empty</h3>
            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">Initialize your first sector to begin curation</p>
          </div>
        )}
      </div>
    </div>
  );
}
