import React, { useEffect, useState } from 'react';
import SceneManager from '../../components/SceneManager';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Filter,
  Play,
  Heart,
  MoreHorizontal,
  Music2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { usePlayerStore } from '../../store/usePlayerStore';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { AmbienceScene } from '../../types';

export default function BusinessScenes() {
  const { setAlbum } = usePlayerStore();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [scenes, setScenes] = useState<AmbienceScene[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'ambience_scenes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const liveScenes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AmbienceScene));
      setScenes(liveScenes);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-indigo-400" size={16} />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Curated Library</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">Ambience Scenes</h2>
          <p className="text-slate-500 mt-2 max-w-xl">
            Select from our prebuilt cinematic atmospheres or architect your own custom venue identities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 group focus-within:border-indigo-500/50 transition-all">
            <Search size={18} className="text-slate-500 group-focus-within:text-indigo-400" />
            <input 
              id="business-scenes-search"
              name="business-scenes-search"
              type="text" 
              placeholder="Search library..." 
              className="bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-600 w-48"
            />
          </div>
          <button className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/5"><Filter size={20} /></button>
          <div className="bg-white/5 p-1 rounded-xl flex items-center gap-1">
             <button onClick={() => setView('grid')} className={cn("p-2 rounded-lg transition-all", view === 'grid' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}><LayoutGrid size={18} /></button>
             <button onClick={() => setView('list')} className={cn("p-2 rounded-lg transition-all", view === 'list' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}><List size={18} /></button>
          </div>
          <button 
            onClick={() => setIsBuilding(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} /> Build Scene
          </button>
        </div>
      </div>

      {isBuilding && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-[32px] p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-3xl">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-serif font-bold italic">Architect Ambience</h2>
               <button onClick={() => setIsBuilding(false)} className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/5 transition-all">Close</button>
             </div>
             <SceneManager />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="aspect-[4/5] rounded-[40px] bg-white/[0.02] animate-pulse" />)}
        </div>
      ) : (
        <div className={cn(
          "grid gap-6",
          view === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {scenes.map((scene, i) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "group relative rounded-[40px] overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-500 bg-white/[0.01]",
                view === 'list' ? "p-4 flex items-center gap-6" : "p-8 aspect-[4/5] flex flex-col justify-end"
              )}
            >
              {/* Background Image/Gradient */}
              {scene.visualIdentity && typeof scene.visualIdentity === 'object' ? (
                <div 
                  className="absolute inset-0 transition-opacity" 
                  style={{ 
                    background: `linear-gradient(to bottom right, ${scene.visualIdentity.fromColor}, ${scene.visualIdentity.toColor})`,
                    opacity: scene.visualIdentity.opacity,
                    filter: `blur(${scene.visualIdentity.blur}px)`
                  }} 
                />
              ) : (
                <div className={cn(
                  "absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br -z-10",
                  (scene.visualIdentity as any) || "from-slate-800 to-indigo-900"
                )} />
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050505] to-transparent -z-10" />

              {/* List View Item */}
              {view === 'list' ? (
                <>
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
                    style={scene.visualIdentity && typeof scene.visualIdentity === 'object' ? {
                      background: `linear-gradient(to bottom right, ${scene.visualIdentity.fromColor}, ${scene.visualIdentity.toColor})`
                    } : {}}
                  >
                    {!scene.visualIdentity || typeof scene.visualIdentity !== 'object' ? (
                      <div className={cn("absolute inset-0 bg-gradient-to-br", (scene.visualIdentity as any) || "from-indigo-500 to-purple-800")} />
                    ) : null}
                    <Music2 className="text-white relative z-10" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{scene.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{scene.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                    <span>Continuous</span>
                    <div className="flex gap-2">
                       {scene.tags?.map(t => <span key={t} className="px-2 py-1 rounded bg-white/5">{t}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 px-4">
                    <button onClick={() => setAlbum(scene as any)} className="p-3 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transform hover:scale-110 active:scale-90 transition-all">
                      <Play size={20} fill="currentColor" />
                    </button>
                    <button className="text-slate-500 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                  </div>
                </>
              ) : (
                /* Grid View Item */
                <>
                  <div className="absolute top-0 right-0 p-8 flex flex-col gap-2">
                     <button className="p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/40 hover:text-rose-500 transition-colors">
                       <Heart size={18} />
                     </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {scene.tags?.map(t => (
                        <span key={t} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold tracking-tight text-white mb-2">{scene.name}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{scene.description}</p>
                    </div>
                    <div className="pt-4 flex items-center justify-between border-t border-white/5">
                      <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Master Presence</span>
                      <button 
                        onClick={() => setAlbum(scene as any)}
                        className="px-6 py-3 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-[10px] transform hover:-translate-y-1 transition-all"
                      >
                        Audit Presence
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
