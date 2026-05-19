import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  LayoutGrid, 
  Clock, 
  Radio, 
  Maximize2,
  RefreshCcw,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, limit, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AmbienceScene } from '../../types';

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentAlbum, isPlaying, togglePlay, volume, setVolume } = usePlayerStore();
  const [isVenueMode, setIsVenueMode] = useState(false);
  const [activeZone, setActiveZone] = useState('Main Zone');
  const [liveScenes, setLiveScenes] = useState<AmbienceScene[]>([]);
  const [systemHealth, setSystemHealth] = useState('Premium');
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    const toastId = toast.loading('Manifesting prime atmospheres...');
    
    const bootstrapData = [
      { id: 'temple-morning', name: 'Temple Morning', description: 'Graceful sunrise ambience.', visualIdentity: { fromColor: '#f59e0b', toColor: '#78350f', blur: 80, opacity: 0.3 }, tags: ['Calm', 'Traditional'], albumIds: ['sample_1'] },
      { id: 'midnight-lounge', name: 'Midnight Lounge', description: 'Deep jazz and fusion for late nights.', visualIdentity: { fromColor: '#1e1b4b', toColor: '#581c87', blur: 100, opacity: 0.4 }, tags: ['Elegant', 'Deep'] },
      { id: 'deep-focus', name: 'Deep Focus', description: 'Minimal textures for productivity.', visualIdentity: { fromColor: '#0f172a', toColor: '#064e3b', blur: 60, opacity: 0.2 }, tags: ['Focus', 'Clean'] },
      { id: 'fusion-dinner', name: 'Fusion Dinner', description: 'Upbeat rhythmic dining atmosphere.', visualIdentity: { fromColor: '#831843', toColor: '#78350f', blur: 90, opacity: 0.3 }, tags: ['Social', 'Vibrant'] },
      { id: 'sacred-calm', name: 'Sacred Calm', description: 'Meditative raga-driven stillness.', visualIdentity: { fromColor: '#1e3a8a', toColor: '#0f172a', blur: 120, opacity: 0.2 }, tags: ['Meditation', 'Peace'] }
    ];

    try {
      // Try server first
      const resp = await fetch('/api/business/bootstrap-scenes', { method: 'POST' });
      if (resp.ok) {
        toast.success('Atmospheres Manifested (Server)', { id: toastId });
      } else {
        // Fallback to client-side write
        console.warn('Server bootstrap failed, attempting client-side manifestation...');
        for (const scene of bootstrapData as any) {
          await setDoc(doc(db, 'ambience_scenes', scene.id), {
            ...scene,
            isPrebuilt: true,
            albumIds: scene.albumIds || [],
            createdAt: serverTimestamp()
          }, { merge: true });
        }
        toast.success('Atmospheres Manifested (Client Fallback)', { id: toastId });
      }
    } catch (err: any) {
      // Last resort: final attempted client-side write if fetch itself failed
      try {
        for (const scene of bootstrapData as any) {
          await setDoc(doc(db, 'ambience_scenes', scene.id), {
            ...scene,
            isPrebuilt: true,
            albumIds: scene.albumIds || [],
            createdAt: serverTimestamp()
          }, { merge: true });
        }
        toast.success('Atmospheres Manifested (Direct)', { id: toastId });
      } catch (finalErr: any) {
        toast.error(`Portal Congestion: ${finalErr.message}`, { id: toastId });
      }
    } finally {
      setIsBootstrapping(false);
    }
  };

  // Listen to global scenes
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'ambience_scenes'), limit(4));
    const unsub = onSnapshot(q, (snap) => {
      const scenes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AmbienceScene));
      setLiveScenes(scenes);
    });
    return () => unsub();
  }, [user]);

  // Venue Mode Kiosk logic
  const toggleVenueMode = () => {
    if (!isVenueMode) {
      document.documentElement.requestFullscreen().catch(() => {
        toast.error("Kiosk mode requires user interaction first.");
      });
      setIsVenueMode(true);
      toast.success("Venue Mode Activated: Kiosk Persistence On");
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      setIsVenueMode(false);
    }
  };

  return (
    <div className="space-y-10">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Control Center */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative p-10 rounded-[40px] overflow-hidden group min-h-[440px] flex flex-col justify-between border transition-all duration-700",
              isPlaying ? "bg-white/[0.03] border-white/10" : "bg-white/[0.02] border-white/5"
            )}
          >
            {/* Ambient Background Gradient - Dynamic based on active scene */}
            {isPlaying && currentAlbum && liveScenes.find(s => s.id === currentAlbum.id)?.visualIdentity ? (
              (() => {
                const vi = liveScenes.find(s => s.id === currentAlbum.id)!.visualIdentity;
                return (
                  <div 
                    className="absolute inset-0 -z-10 transition-all duration-1000"
                    style={{
                      background: `linear-gradient(to bottom right, ${vi.fromColor}, ${vi.toColor})`,
                      opacity: vi.opacity * 2.5,
                      filter: `blur(${vi.blur}px)`
                    }}
                  />
                );
              })()
            ) : (
              <div className={cn(
                "absolute inset-0 opacity-40 blur-[100px] -z-10 transition-all duration-1000",
                isPlaying ? "bg-indigo-500" : "bg-slate-700"
              )} />
            )}

            <div className="flex justify-between items-start">
              <div>
                <span className="px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                  Venue Control
                </span>
                <h3 className="mt-6 text-5xl font-bold tracking-tight text-white leading-tight">
                  {currentAlbum?.title || 'No Scene Active'}
                </h3>
                <p className="text-slate-300 text-xl mt-3 font-light">
                  {currentAlbum?.artist || 'Select an ambience scene to begin'}
                </p>
              </div>
              <button 
                onClick={toggleVenueMode}
                className={cn(
                  "p-4 rounded-2xl transition-all duration-300 border flex items-center gap-2",
                  isVenueMode 
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20" 
                    : "bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:text-white"
                )}
              >
                <Maximize2 size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Venue Mode</span>
              </button>
            </div>

            <div className="space-y-8">
              {/* Playback Progress */}
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: isPlaying ? ['-100%', '0%'] : '-100%' }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="h-full w-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono tracking-tighter">
                  <span>LIVE PHASE</span>
                  <span>SYNCED TO VENUE</span>
                </div>
              </div>

              {/* Large Controls */}
              <div className="flex items-center gap-10">
                <button 
                  onClick={togglePlay}
                  className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20"
                >
                  {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="translate-x-1" fill="currentColor" />}
                </button>
                <div className="flex items-center gap-4 flex-1">
                  <Volume2 className="text-slate-400" size={24} />
                  <input
                    id="business-volume"
                    name="business-volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-500 h-1.5 rounded-full cursor-pointer bg-white/10"
                  />
                  <span className="text-sm font-mono text-slate-400">{Math.round(volume * 100)}%</span>
                </div>
                <button className="p-4 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-colors border border-white/10">
                  <SkipForward size={24} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Scene Switcher was here */}
        </div>

        {/* Sidebar Context */}
        <div className="space-y-8">
          {/* Active Scene Card */}
          <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Active Scene</h4>
              <RefreshCcw className="text-indigo-400" size={18} />
            </div>
            
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20">
                <Radio className="text-indigo-400" size={30} />
              </div>
              <div>
                <h4 className="text-xl font-bold">{currentAlbum?.title || 'Inactive'}</h4>
                <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase mt-1">Live Now</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Scenes Card */}
            <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Scenes</h4>
              <p className="text-sm text-slate-400 mb-8">Curate and manage your venue atmosphere.</p>
              <button 
                onClick={() => navigate('/business/scenes')}
                className="w-full py-4 rounded-2xl bg-indigo-500 font-bold text-xs uppercase tracking-widest text-white hover:bg-indigo-400 transition-all">
                Manage Scenes
              </button>
            </div>
            
            {/* Schedules Card */}
            <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Scheduler</h4>
              <p className="text-sm text-slate-400 mb-8">Automate atmospheric transitions.</p>
              <button 
                onClick={() => navigate('/business/schedules')}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                Manage Scheduler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
