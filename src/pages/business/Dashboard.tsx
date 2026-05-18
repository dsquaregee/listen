import React, { useEffect, useState } from 'react';
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

const AMBIENCE_SCENES = [
  { id: 'temple-morning', name: 'Temple Morning', status: 'Optimal', color: 'from-orange-500/20 to-amber-900/20', borderColor: 'border-orange-500/30' },
  { id: 'midnight-lounge', name: 'Midnight Lounge', status: 'Scheduled next', color: 'from-indigo-500/20 to-purple-900/20', borderColor: 'border-indigo-500/30' },
  { id: 'fusion-dinner', name: 'Fusion Dinner', status: 'Ready', color: 'from-rose-500/20 to-amber-950/20', borderColor: 'border-rose-500/30' },
  { id: 'sacred-calm', name: 'Sacred Calm', status: 'Ready', color: 'from-blue-500/20 to-slate-900/20', borderColor: 'border-blue-500/30' },
];

export default function BusinessDashboard() {
  const { user } = useAuthStore();
  const { currentAlbum, isPlaying, togglePlay, volume, setVolume } = usePlayerStore();
  const [isVenueMode, setIsVenueMode] = useState(false);
  const [activeZone, setActiveZone] = useState('Main Zone');
  const [systemHealth, setSystemHealth] = useState('Premium');

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
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'System Health', value: systemHealth, icon: Zap, color: 'text-emerald-500' },
          { label: 'Network', value: 'Stable', icon: Globe, color: 'text-blue-500' },
          { label: 'Next Event', value: '6:00 PM', icon: Clock, color: 'text-amber-500' },
          { label: 'Active Zone', value: activeZone, icon: Radio, color: 'text-indigo-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Control Center */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative p-8 rounded-[40px] overflow-hidden group min-h-[400px] flex flex-col justify-between border transition-all duration-700",
              isPlaying ? "bg-indigo-600/10 border-indigo-500/20" : "bg-white/[0.02] border-white/5"
            )}
          >
            {/* Ambient Background Gradient */}
            <div className={cn(
              "absolute inset-0 opacity-40 blur-[100px] -z-10 transition-all duration-1000",
              isPlaying ? "bg-indigo-500" : "bg-slate-700"
            )} />

            <div className="flex justify-between items-start">
              <div>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                  Now Streaming
                </span>
                <h3 className="mt-4 text-4xl font-bold tracking-tight text-white leading-tight">
                  {currentAlbum?.title || 'No Scene Active'}
                </h3>
                <p className="text-slate-400 text-lg mt-2 font-light">
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
              {/* Playback Progress (Fake for visual Os) */}
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

          {/* Quick Scene Switcher */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <LayoutGrid size={16} /> Ambient Scenes
              </h4>
              <button className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors">
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AMBIENCE_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  className={cn(
                    "p-6 rounded-[32px] border transition-all duration-500 group text-left relative overflow-hidden",
                    scene.id === 'midnight-lounge' ? "bg-white/5 border-white/20 ring-2 ring-indigo-500/20" : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                  )}
                >
                  <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br", scene.color)} />
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <h5 className="font-semibold text-lg">{scene.name}</h5>
                      <p className="text-xs text-slate-500 mt-1">{scene.status}</p>
                    </div>
                    <Radio className="text-slate-600 group-hover:text-indigo-500 transition-colors" size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-8">
          {/* Active Schedule Card */}
          <div className="p-8 rounded-[40px] bg-indigo-600/10 border border-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6">
              <RefreshCcw className="text-indigo-500/50 group-hover:rotate-180 transition-transform duration-1000" size={20} />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-6">Active Schedule</h4>
            <div className="space-y-6">
              {[
                { time: '07:00 – 11:00', label: 'Temple Morning', active: false },
                { time: '11:00 – 16:00', label: 'Fusion Slow', active: false, current: true },
                { time: '18:00 – 22:00', label: 'Pulse Lounge', active: false }
              ].map((item, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-4 relative",
                  item.current ? "opacity-100" : "opacity-40"
                )}>
                  {item.current && <div className="absolute -left-4 w-1 h-10 bg-indigo-500 rounded-full" />}
                  <div className="flex-1">
                    <p className="text-[10px] font-mono text-slate-500 tracking-tighter">{item.time}</p>
                    <p className="text-sm font-semibold mt-0.5">{item.label}</p>
                  </div>
                  {item.current && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-[10px] font-bold uppercase tracking-widest">
                      Now
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              Manage Scheduler
            </button>
          </div>

          {/* Quick Zone Control */}
          <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Active Zones</h4>
            <div className="space-y-4">
              {['Main Zone', 'Private Lounge', 'Terrace'].map((zone) => (
                <div 
                  key={zone}
                  onClick={() => setActiveZone(zone)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
                    activeZone === zone ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                  )}
                >
                  <span className="text-sm font-medium">{zone}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    activeZone === zone ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-slate-700"
                  )} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
