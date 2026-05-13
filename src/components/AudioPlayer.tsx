import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Maximize2, Minimize2,
  ChevronDown, Heart, Clock, ListMusic, Activity,
  GripVertical, X, Trash2, CheckCircle2,
  Zap, Share2, Twitter, Facebook, Instagram, Link,
  PlusCircle, FolderPlus, ListPlus, Download,
  Shuffle, Repeat, Repeat1, Search, ExternalLink
} from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { hapticFeedback } from '../lib/haptics';
import { useUserStore } from '../store/useUserStore';
import { MOCK_ALBUMS } from '../data/mockData';
import { formatTime, cn } from '../lib/utils';
import { streamingService, StreamingService } from '../services/streamingService';
import { offlineService } from '../services/offlineService';
import { Album } from '../types';

interface QueueItemProps {
  album: Album;
  onRemove: (id: string) => void;
  onPlay: (album: Album) => void;
  isActive: boolean;
  index: number;
  canReorder: boolean;
  key?: string | number;
}

function QueueItem({ album, onRemove, onPlay, isActive, index, canReorder }: QueueItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controls = useDragControls();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(false);
  };

  return (
    <Reorder.Item 
      value={album}
      id={album.id}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative py-1 select-none focus:outline-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tooltip Overlay */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-64 p-4 rounded-2xl bg-black/90 border border-white/10 backdrop-blur-xl shadow-2xl z-[100] pointer-events-none"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <h5 className="text-[9px] font-bold text-accent uppercase tracking-[0.2em] opacity-80">Experience Intel</h5>
                <div className="flex items-center gap-1 text-[9px] text-white/40 font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(album.duration)}
                </div>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed italic font-light line-clamp-4">
                {album.description}
              </p>
              <div className="flex flex-wrap gap-1 pt-1 opacity-50">
                {album.moodTags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[8px] text-white/60 lowercase italic">#{tag}</span>
                ))}
              </div>
            </div>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-black/90 border-r border-t border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl transition-all group relative border",
          isActive 
            ? "bg-white/10 border-accent/30 shadow-[0_0_30px_rgba(153,102,204,0.25)] ring-1 ring-accent/20" 
            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/5 hover:border-white/10",
        )}
      >
        <div className="flex items-center gap-3">
          <div 
            onPointerDown={(e) => {
              if (canReorder) {
                controls.start(e);
              }
            }}
            className={cn(
              "p-1 transition-colors touch-none",
              !canReorder 
                ? "text-white/5 cursor-not-allowed" 
                : "cursor-grab active:cursor-grabbing text-white/20 hover:text-primary"
            )}
            title={!canReorder ? "Cannot reorder while filtering" : "Drag to reorder"}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-mono font-bold text-white/10 w-4 group-hover:text-white/30 transition-colors">
            {(index + 1).toString().padStart(2, '0')}
          </span>
        </div>
        
        <div 
          className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer shadow-lg group-hover:shadow-accent/10 transition-shadow"
          onClick={() => onPlay(album)}
        >
          <img src={album.coverUrl || undefined} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlay(album)}>
          <h4 className={cn("text-xs font-bold truncate tracking-tight transition-colors flex items-center gap-2", isActive ? "text-accent" : "text-white group-hover:text-accent")}>
            {album.title}
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Activity className="w-3 h-3 text-accent" />
              </motion.div>
            )}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[9px] text-white/30 uppercase tracking-[0.1em] truncate">
              {album.artist} <span className="mx-1 text-white/10">•</span> {album.moodTags[0]}
            </p>
            {album.isDownloaded && (
              <CheckCircle2 className="w-2.5 h-2.5 text-primary/40 shrink-0" />
            )}
          </div>
          <p className="text-[8px] text-white/10 line-clamp-1 mt-0.5 italic group-hover:text-white/20 transition-colors">
            {album.description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] font-mono text-white/20 group-hover:text-white/40 transition-colors">
            {formatTime(album.duration)}
          </span>
          <button 
            onClick={() => onRemove(album.id)}
            className="p-2 text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
}

interface WaveformSeekbarProps {
  progress: number;
  isPlaying: boolean;
  onSeek: (progress: number) => void;
  albumId: string;
  frequencyValue?: number;
  duration?: number;
}

function WaveformSeekbar({ progress, isPlaying, onSeek, albumId, frequencyValue = 0, duration = 0 }: WaveformSeekbarProps) {
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [localProgress, setLocalProgress] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate pseudo-random but consistent heights based on albumId with more organic variation
  const points = React.useMemo(() => {
    const seed = albumId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const getNoise = (x: number) => {
      return (
        Math.abs(Math.sin(seed + x * 0.1) * 0.4) +
        Math.abs(Math.sin(x * 0.25 + seed * 0.5) * 0.3) +
        Math.abs(Math.sin(x * 0.6 + seed * 0.2) * 0.2) +
        Math.abs(Math.sin(x * 1.5) * 0.1)
      );
    };

    return Array.from({ length: 120 }, (_, i) => {
      const val = getNoise(i);
      // Envelope to taper ends
      const envelope = Math.sin((i / 120) * Math.PI);
      return Math.max(0.04, val * envelope);
    });
  }, [albumId]);

  const displayProgress = localProgress !== null ? localProgress : progress;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center group select-none cursor-pointer"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setHoverProgress(p);
      }}
      onClick={(e) => {
        // Only seek on click if we didn't just finish a drag
        if (localProgress === null) {
          const rect = e.currentTarget.getBoundingClientRect();
          const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onSeek(p);
        }
      }}
      onMouseLeave={() => setHoverProgress(null)}
    >
      {/* Time Tooltip */}
      <AnimatePresence>
        {hoverProgress !== null && duration > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute -top-12 z-50 pointer-events-none px-3 py-1.5 rounded-lg bg-black/90 border border-white/20 backdrop-blur-md shadow-2xl text-[10px] font-mono font-bold text-primary whitespace-nowrap"
            style={{ left: `${hoverProgress * 100}%`, x: '-50%' }}
          >
            {formatTime(hoverProgress * duration)}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Glow Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
        <motion.div 
          className="absolute h-full w-48 blur-[80px] bg-gradient-to-r from-transparent via-[#9966CC]/20 to-transparent"
          style={{ left: `${displayProgress * 100}%`, x: '-50%' }}
        />
        {/* Frequency reactive glow */}
        {isPlaying && (
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute inset-0 bg-primary/5 blur-[100px]"
          />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-12 top-12 flex items-center justify-between gap-[2px] z-10">
        {points.map((height, i) => {
          const pointProgress = i / points.length;
          const isActive = displayProgress >= pointProgress;
          const isHovered = hoverProgress !== null && Math.abs(hoverProgress - pointProgress) < 0.03;
          const distanceToPlayhead = Math.abs(displayProgress - pointProgress);
          const isNearPlayhead = distanceToPlayhead < 0.1;
          
          // Audio Reactive Height
          const reactiveHeight = isPlaying && isActive 
            ? height * (1 + frequencyValue * 0.8 * (1 - distanceToPlayhead))
            : height;
          
          return (
            <div key={i} className="flex-1 h-full flex flex-col items-center justify-center gap-[1px]">
              {/* Top half */}
              <motion.div
                initial={false}
                animate={{ 
                  height: `${reactiveHeight * 100}%`,
                  opacity: isActive ? 1 : isHovered ? 0.8 : 0.12,
                  backgroundColor: isActive ? 'var(--color-primary)' : '#ffffff',
                  boxShadow: (isActive && isNearPlayhead) ? `0 0 ${10 + frequencyValue * 20}px rgba(153,102,204,${0.4 + frequencyValue})` : 'none',
                  scale: (isPlaying && isNearPlayhead) ? [1, 1.05, 1] : 1
                }}
                  transition={{ 
                    duration: 0.1,
                    scale: isPlaying ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { duration: 0.2 }
                  }}
                className={cn(
                  "w-full rounded-t-[1px] transition-colors duration-500",
                  isActive && "shadow-[0_0_8px_rgba(153,102,204,0.2)]"
                )}
              />
              {/* Bottom half (mirrored reflection) */}
              <motion.div
                initial={false}
                animate={{ 
                  height: `${reactiveHeight * 50}%`,
                  opacity: isActive ? 0.4 : isHovered ? 0.3 : 0.05,
                  backgroundColor: isActive ? 'var(--color-primary)' : '#ffffff',
                  filter: 'blur(0.5px)',
                  scale: (isPlaying && isNearPlayhead) ? [1, 1.05, 1] : 1
                }}
                transition={{ 
                  duration: 0.3,
                  scale: isPlaying ? { repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.1 } : { duration: 0.2 }
                }}
                className="w-full rounded-b-[1px] transition-colors duration-500"
              />
            </div>
          );
        })}
      </div>

      {/* Hover Information Line */}
      {hoverProgress !== null && (
        <motion.div 
          className="absolute inset-y-0 w-px bg-white/20 pointer-events-none z-20 border-r border-white/5"
          style={{ left: `${hoverProgress * 100}%` }}
        />
      )}

      {/* Transparent Input for Seeking */}
      <input 
        type="range"
        min="0"
        max="1"
        step="0.0005"
        value={displayProgress}
        onMouseDown={() => setLocalProgress(progress)}
        onTouchStart={() => setLocalProgress(progress)}
        onMouseUp={() => {
          if (localProgress !== null) {
            onSeek(localProgress);
            setLocalProgress(null);
          }
        }}
        onTouchEnd={() => {
          if (localProgress !== null) {
            onSeek(localProgress);
            setLocalProgress(null);
          }
        }}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          setLocalProgress(val);
          // Optional: seek live if user wants to hear while dragging, 
          // but many players only seek on release to avoid buffer issues.
          // Let's do it on release to be safe.
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40"
      />

      {/* Playhead Indicator with Custom Glow */}
      <motion.div 
        className="absolute top-0 bottom-0 w-[3px] bg-accent z-30 pointer-events-none"
        style={{ left: `${displayProgress * 100}%`, x: '-50%' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 -translate-y-1/2 bg-accent blur-xl opacity-40 rounded-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 translate-y-1/2 bg-accent blur-xl opacity-40 rounded-full" />
        
        {/* Playhead Bead */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(212,187,255,0.8)] ring-4 ring-accent/30"
          animate={{ scale: isPlaying ? [1, 1.3, 1] : 1 }}
          transition={isPlaying ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}
        />
      </motion.div>
    </div>
  );
}

interface QualitySelectorProps {
  onQualityChange: (level: number) => void;
  currentLevel: number;
  levels: any[];
}

function QualitySelector({ onQualityChange, currentLevel, levels }: QualitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getLabel = (index: number) => {
    if (index === -1) return "Auto";
    const level = levels[index];
    if (!level) return "Standard";
    if (level.height >= 1080) return "Master 4K";
    if (level.height >= 720) return "Ultra HD";
    if (level.height >= 480) return "Studio HD";
    return "Standard";
  };

  const getSubLabel = (index: number) => {
    if (index === -1) return "Optimized";
    const level = levels[index];
    if (!level) return "";
    return `${level.height}p • ${(level.bitrate / 1000000).toFixed(1)} Mbps`;
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-all group"
      >
        <div className={cn(
          "p-1 rounded-md transition-colors",
          isOpen ? "bg-white/10 text-primary" : "group-hover:bg-white/5"
        )}>
          <Zap className="w-5 h-5" />
        </div>
        <span className="text-[8px] font-bold uppercase tracking-widest">
          {getLabel(currentLevel)}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-4 right-0 w-56 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[110] backdrop-blur-xl"
            >
              <div className="p-4 border-b border-white/5">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Atmosphere Fidelity</h3>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    onQualityChange(-1);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                    currentLevel === -1 ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="text-left">
                    <p className={cn("text-xs font-bold", currentLevel === -1 ? "text-primary" : "text-white")}>Auto Adaptive</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">Network Optimized</p>
                  </div>
                  {currentLevel === -1 && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(153,102,204,0.4)]" />}
                </button>

                {levels.map((level, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onQualityChange(i);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                      currentLevel === i ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className="text-left">
                      <p className={cn("text-xs font-bold", currentLevel === i ? "text-primary" : "text-white")}>{getLabel(i)}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{getSubLabel(i)}</p>
                    </div>
                    {currentLevel === i && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(153,102,204,0.4)]" />}
                  </button>
                ))}
              </div>
              <div className="p-4 bg-white/5 border-t border-white/5">
                <p className="text-[8px] text-white/20 italic text-center uppercase tracking-widest">Master Quality Audio Engine</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album;
}

function PlaylistModal({ isOpen, onClose, album }: PlaylistModalProps) {
  const { user } = useAuthStore();
  const { playlists, createPlaylist, addAlbumToPlaylist } = useUserStore();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-serif font-bold text-white italic">Preserve Experience</h3>
            <p className="text-[10px] text-primary uppercase tracking-widest mt-1">Add to Collection</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div className="p-12 text-center space-y-4">
            <p className="text-sm text-white/60">Authentication required to preserve atmospheres.</p>
            <div className="text-[10px] text-primary font-bold uppercase tracking-widest">Sign in to continue</div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Create New Sector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">New Sector</h4>
                {isCreating && (
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="text-[9px] text-primary uppercase font-bold hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              {!isCreating ? (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-primary transition-colors">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">Initialize New Playlist</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <input 
                    autoFocus
                    value={newPlaylistName}
                    onChange={e => setNewPlaylistName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newPlaylistName) {
                        createPlaylist(user.uid, newPlaylistName);
                        setNewPlaylistName('');
                        setIsCreating(false);
                      }
                    }}
                    placeholder="Atmosphere name..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                  <button 
                    disabled={!newPlaylistName}
                    onClick={() => {
                      createPlaylist(user.uid, newPlaylistName);
                      setNewPlaylistName('');
                      setIsCreating(false);
                    }}
                    className="px-4 bg-primary text-black rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* Existing Sectors */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Existing Atmospheres</h4>
              <div className="space-y-2">
                {playlists.length > 0 ? (
                  playlists.map(pl => (
                    <button
                      key={pl.id}
                      onClick={() => {
                        addAlbumToPlaylist(pl.id, album.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 overflow-hidden">
                          <FolderPlus className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-white truncate">{pl.name}</p>
                          <p className="text-[10px] text-white/20 uppercase tracking-widest">{pl.albumIds.length} Experiences</p>
                        </div>
                      </div>
                      <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlusCircle className="w-4 h-4 text-primary" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center bg-white/[0.02] rounded-2xl border border-white/5 italic text-xs text-white/20">
                    No atmospheres discovered yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-lg">
             <img src={album.coverUrl || undefined} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-white truncate">{album.title}</p>
            <p className="text-[8px] text-white/40 uppercase tracking-widest truncate">{album.artist}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AudioPlayer() {
  const audioRef1 = useRef<HTMLAudioElement | null>(null);
  const audioRef2 = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const service1Ref = useRef(new StreamingService());
  const service2Ref = useRef(new StreamingService());
  const isTransitioningRef = useRef(false);
  const previousAlbumIdRef = useRef<string | null>(null);
  
  const location = useLocation();
  const { 
    currentAlbum, isPlaying, progress, currentTime, duration, 
    volume, isMinimized, queue, togglePlay, play, pause, setProgress, setCurrentTime, 
    setDuration, setMinimized, setVolume, next, previous, reorderQueue, removeFromQueue, setAlbum, clearQueue,
    userTier, offlineAlbums, refreshOfflineStatus, preferredQuality, setPreferredQuality,
    autoPlayNext, setAutoPlayNext, isShuffled, repeatMode, toggleShuffle, toggleRepeat
  } = usePlayerStore();

  const { favorites, toggleLike } = useUserStore();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [queueSearch, setQueueSearch] = useState('');
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);

  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isMainVolumeHovered, setIsMainVolumeHovered] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isQueueOpen) {
      setQueueSearch('');
    }
  }, [isQueueOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if focus is in an input (except the search input itself for Esc)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (isQueueOpen) {
        if (e.key === '/' && !isInput) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
        if (e.key === 'Escape') {
          if (queueSearch && target === searchInputRef.current) {
            setQueueSearch('');
          } else if (!isInput || target === searchInputRef.current) {
            setIsQueueOpen(false);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQueueOpen, queueSearch]);

  const handleDeleteDownload = async (albumId: string) => {
    await offlineService.deleteAlbum(albumId);
    const updatedIds = await offlineService.getOfflineAlbumIds();
    refreshOfflineStatus(updatedIds);
  };
  
  const handleTogglePlay = async () => {
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(console.error);
    }
    hapticFeedback.medium();
    const currentAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
    if (!currentAudio) {
      togglePlay();
      return;
    }

    if (isPlaying) {
      currentAudio.pause();
      pause();
    } else {
      try {
        console.log('Attempting manual play');
        await currentAudio.play();
        play();
      } catch (err) {
        console.error('Direct play failed:', err);
        // Fallback for store state
        play();
      }
    }
  };
  
  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Listening to ${currentAlbum?.title} by ${currentAlbum?.artist} on DsquareGee | Carnatic Instrumental Experience: ${window.location.origin}/album/${currentAlbum?.id}`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Listening to ${currentAlbum?.title} by ${currentAlbum?.artist} on DsquareGee | Carnatic Revolution`)}&url=${encodeURIComponent(window.location.origin + '/album/' + currentAlbum?.id)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/album/' + currentAlbum?.id)}`,
    instagram: `https://www.instagram.com/`,
    tiktok: `https://www.tiktok.com/`,
  };

  const copyLink = () => {
    if (!currentAlbum) return;
    const link = `${window.location.origin}/album/${currentAlbum.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      hapticFeedback.medium();
      setTimeout(() => {
        setCopied(false);
        setIsShareOpen(false);
      }, 1500);
    });
  };

  const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );

  const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
    </svg>
  );
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showActiveTooltip, setShowActiveTooltip] = useState(false);
  const activeTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadEta, setDownloadEta] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const lastOfflineUrlRef = useRef<string | null>(null);
  
  // Sleep Timer state
  const lastRecordedMinuteRef = useRef<number>(0);

  useEffect(() => {
    if (isPlaying && currentAlbum) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now - lastRecordedMinuteRef.current >= 60000) {
          useUserStore.getState().recordListening(currentAlbum.id, 1);
          lastRecordedMinuteRef.current = now;
        }
      }, 10000); // Check every 10s
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentAlbum]);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle sleep timer countdown
  useEffect(() => {
    if (sleepTimerRemaining !== null && sleepTimerRemaining > 0 && isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setSleepTimerRemaining(prev => {
          if (prev !== null && prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            togglePlay(); // Pause playback
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sleepTimerRemaining, isPlaying, togglePlay]);

  const setSleepTimer = (minutes: number) => {
    setSleepTimerRemaining(minutes * 60);
    setIsSleepTimerOpen(false);
  };

  const cancelSleepTimer = () => {
    setSleepTimerRemaining(null);
    setIsSleepTimerOpen(false);
  };

  // Handle toast timeout
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [frequencyValue, setFrequencyValue] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceNode1Ref = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceNode2Ref = useRef<MediaElementAudioSourceNode | null>(null);

  // Audio Analysis for Parallax Effect
  useEffect(() => {
    if (!audioRef1.current || !audioRef2.current || !isHydrated) return;

    const setupAnalyzer = () => {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
          audioCtxRef.current = new AudioContextClass();
        }

        const audioCtx = audioCtxRef.current;

        if (!analyzerRef.current) {
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          analyzerRef.current = analyser;
          analyser.connect(audioCtx.destination);
        }

        const analyser = analyzerRef.current;

        // Connect sources if not already connected
        if (!sourceNode1Ref.current && audioRef1.current) {
          console.log('Connecting AudioRef1 to analyzer');
          sourceNode1Ref.current = audioCtx.createMediaElementSource(audioRef1.current);
          sourceNode1Ref.current.connect(analyser);
        }
        if (!sourceNode2Ref.current && audioRef2.current) {
          console.log('Connecting AudioRef2 to analyzer');
          sourceNode2Ref.current = audioCtx.createMediaElementSource(audioRef2.current);
          sourceNode2Ref.current.connect(analyser);
        }

        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
          if (analyzerRef.current && isPlaying) {
            analyzerRef.current.getByteFrequencyData(dataArray);
            const avg = (dataArray[1] + dataArray[2] + dataArray[3]) / 3;
            setFrequencyValue(avg / 255);
          } else {
            setFrequencyValue(0);
          }
          animationFrameRef.current = requestAnimationFrame(update);
        };
        update();
      } catch (e) {
        console.warn('Audio analyzer initialization issue:', e);
      }
    };

    if (isPlaying) {
      setupAnalyzer();
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isHydrated, isPlaying]);

  // Handle Hydration and Refresh Offline Status
  useEffect(() => {
    setIsHydrated(true);
    const syncOfflineStatus = async () => {
      // Explicitly check availability for current viewable universe to ensure synchronization
      const offlineChecks = await Promise.all(
        MOCK_ALBUMS.map(async (album) => {
          const isOffline = await offlineService.isAlbumOffline(album.id);
          return isOffline ? album.id : null;
        })
      );
      
      const activeOfflineIds = offlineChecks.filter((id): id is string => id !== null);
      refreshOfflineStatus(activeOfflineIds);
    };
    syncOfflineStatus();
  }, []); // Only once on mount

  // Initialize Streaming Services
  useEffect(() => {
    if (audioRef1.current && audioRef2.current) {
      console.log('Initializing services with audio elements');
      
      const handleError = (error: string, url?: string) => {
        console.error('Streaming Player Error:', error, 'at', url);
        let message = 'Playback error occurred.';
        
        if (error.includes('HTTP 403')) {
          const domain = url ? new URL(url).hostname : 'storage.googleapis.com';
          message = `Access Denied (403). ${domain} needs public access and CORS configuration.`;
        } else if (error.includes('networkError')) {
          message = 'Connection issue. Please check your network or stream configuration.';
        }

        setToast({ 
          message,
          type: 'error' 
        });
        pause(); // Stop UI state
      };

      service1Ref.current.initialize(audioRef1.current);
      service1Ref.current.setOnError(handleError);
      
      service2Ref.current.initialize(audioRef2.current);
      service2Ref.current.setOnError(handleError);
      
      // Default audioRef points to active player
      audioRef.current = activePlayer === 1 ? audioRef1.current : audioRef2.current;
    }
    return () => {
      service1Ref.current.destroy();
      service2Ref.current.destroy();
      if (lastOfflineUrlRef.current) {
        URL.revokeObjectURL(lastOfflineUrlRef.current);
      }
    };
  }, [isHydrated]); // Changed dependency to isHydrated to ensure it runs when components are ready

  // Sync active audioRef
  useEffect(() => {
    audioRef.current = activePlayer === 1 ? audioRef1.current : audioRef2.current;
  }, [activePlayer]);

  const crossfadeDuration = 1500; // ms

  const performCrossfade = async (nextPlayer: 1 | 2, url: string, isOffline: boolean) => {
    const nextAudio = nextPlayer === 1 ? audioRef1.current : audioRef2.current;
    const currentAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
    const nextService = nextPlayer === 1 ? service1Ref.current : service2Ref.current;

    if (!nextAudio || !currentAudio) return;

    // Ensure services are initialized
    if (nextAudio) nextService.initialize(nextAudio);

    console.log('Starting crossfade to player', nextPlayer);

    // Load and start next track at 0 volume
    nextAudio.volume = 0;
    nextService.loadSource(url);
    if (preferredQuality !== -1 && !isOffline) {
      nextService.switchQuality(preferredQuality);
    }
    
    try {
      await nextAudio.play();
      
      const startTime = Date.now();
      const startVolume = volume;

      const fadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const fadeProgress = Math.min(elapsed / crossfadeDuration, 1);

        // Fade current down
        currentAudio.volume = startVolume * (1 - fadeProgress);
        // Fade next up
        nextAudio.volume = startVolume * fadeProgress;

        if (fadeProgress >= 1) {
          clearInterval(fadeInterval);
          currentAudio.pause();
          currentAudio.currentTime = 0;
          setActivePlayer(nextPlayer);
          isTransitioningRef.current = false;
        }
      }, 50);
    } catch (err) {
      console.error('Crossfade failed', err);
      // Fallback: immediate switch
      nextAudio.volume = volume;
      currentAudio.pause();
      setActivePlayer(nextPlayer);
      isTransitioningRef.current = false;
    }
  };

  // Handle source changes with HLS and Resume from state
  useEffect(() => {
    const initializeSource = async () => {
      if (isHydrated && currentAlbum && audioRef1.current && audioRef2.current) {
        let sourceUrl = currentAlbum.hlsUrl;
        let isUsingOffline = false;
        
        if (offlineAlbums.includes(currentAlbum.id)) {
          try {
            const offlineUrl = await offlineService.getOfflineUrl(currentAlbum.id);
            if (offlineUrl) {
              sourceUrl = offlineUrl;
              isUsingOffline = true;
            }
          } catch (err) {
            console.error('Offline load failure', err);
          }
        }

        setIsOfflineMode(isUsingOffline);

        // If it's a new album and we're not currently in the middle of a triggered transition
        if (previousAlbumIdRef.current && previousAlbumIdRef.current !== currentAlbum.id && isPlaying) {
          const nextPlayer = activePlayer === 1 ? 2 : 1;
          isTransitioningRef.current = true;
          performCrossfade(nextPlayer, sourceUrl, isUsingOffline);
        } else {
  // Standard initialization for first run or manual play
          const currentService = activePlayer === 1 ? service1Ref.current : service2Ref.current;
          const currentAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
          
          if (currentAudio) {
            // Guarantee initialization before loading source
            currentService.initialize(currentAudio);
            
            console.log('Initializing current player with source:', sourceUrl);
            currentAudio.volume = volume;
            currentService.loadSource(sourceUrl);
            if (currentTime > 0) currentAudio.currentTime = currentTime;
            if (preferredQuality !== -1 && !isUsingOffline) currentService.switchQuality(preferredQuality);
            
            if (isPlaying) {
              currentAudio.play().catch(err => {
                console.warn('Auto-play blocked or failed:', err);
              });
            }
          }
        }
        
        previousAlbumIdRef.current = currentAlbum.id;
      }
    };

    initializeSource();
  }, [currentAlbum?.id, isHydrated]);

  // Premium event listener
  useEffect(() => {
    const handlePremiumReq = () => setShowPremiumModal(true);
    window.addEventListener('premium-required', handlePremiumReq);
    return () => window.removeEventListener('premium-required', handlePremiumReq);
  }, []);

  const handleDownload = async () => {
    if (!currentAlbum || userTier !== 'premium') {
      setShowPremiumModal(true);
      return;
    }
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadEta(null);
    try {
      await offlineService.downloadAlbum(
        currentAlbum.id, 
        currentAlbum.hlsUrl, 
        (progress, eta) => {
          setDownloadProgress(progress);
          if (eta !== undefined) setDownloadEta(eta);
        }
      );
      refreshOfflineStatus([...offlineAlbums, currentAlbum.id]);
      setToast({ message: `${currentAlbum.title} preserved offline.`, type: 'success' });
    } catch (error) {
      console.error('Download failed', error);
      setToast({ message: 'Preservation failed. Check connection.', type: 'error' });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadEta(null);
    }
  };

  // Sync isPlaying state
  useEffect(() => {
    const currentAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
    if (!currentAudio || !currentAlbum || isTransitioningRef.current) return;

    if (isPlaying) {
      currentAudio.play().catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('Sync play failed:', err);
        }
      });
    } else {
      currentAudio.pause();
    }
  }, [isPlaying, activePlayer, currentAlbum?.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle progress updates
  const handleTimeUpdate = () => {
    const activeAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
    if (!activeAudio) return;

    const time = activeAudio.currentTime;
    const dur = activeAudio.duration;
    
    if (time > 0) {
      setCurrentTime(time);
    }
    
    if (dur && !isNaN(dur) && dur > 0) {
      setDuration(dur);
      setProgress(time / dur);

      // Trigger crossfade 2 seconds before end
      // Only if autoPlayNext is on OR repeatMode is on (to loop back to start/next)
      // AND it's a NEW track (to allow crossfade). If it's the same track (repeatMode === 'one'),
      // we let onEnded handle the simple loop to avoid crossfading with self.
      const isRepeatOne = repeatMode === 'one';
      if (!isRepeatOne && dur > 20 && time > 10 && dur - time < 2 && !isTransitioningRef.current && (autoPlayNext || repeatMode === 'all')) {
        console.log('Triggering auto-advance/repeat transition at time:', time, 'duration:', dur);
        next();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSeekValue(parseFloat(e.target.value));
  };

  const handleSeekValue = (val: number) => {
    if (audioRef.current) {
      const time = val * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      setProgress(val);
    }
  };

  const handleQualityChange = (level: number) => {
    const actService = activePlayer === 1 ? service1Ref.current : service2Ref.current;
    actService.switchQuality(level);
    setPreferredQuality(level);
  };

  // Explicit loop reset for repeatMode === 'one'
  const handleAudioEnded = () => {
    if (repeatMode === 'one') {
      const activeAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
      if (activeAudio) {
        activeAudio.currentTime = 0;
        activeAudio.play().catch(console.error);
        setCurrentTime(0);
        setProgress(0);
      }
    } else if (autoPlayNext || repeatMode === 'all') {
      next();
    }
  };

  if (!isHydrated || !currentAlbum) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] h-24 px-8 pb-4">
      <audio
        ref={audioRef1}
        crossOrigin="anonymous"
        preload="auto"
        onTimeUpdate={activePlayer === 1 ? handleTimeUpdate : undefined}
        onEnded={activePlayer === 1 ? handleAudioEnded : undefined}
        onLoadedMetadata={activePlayer === 1 ? ((e) => setDuration(e.currentTarget.duration)) : undefined}
        onError={(e) => console.error('Audio 1 Error:', e.currentTarget.error)}
      />
      <audio
        ref={audioRef2}
        crossOrigin="anonymous"
        preload="auto"
        onTimeUpdate={activePlayer === 2 ? handleTimeUpdate : undefined}
        onEnded={activePlayer === 2 ? handleAudioEnded : undefined}
        onLoadedMetadata={activePlayer === 2 ? ((e) => setDuration(e.currentTarget.duration)) : undefined}
        onError={(e) => console.error('Audio 2 Error:', e.currentTarget.error)}
      />

      <AnimatePresence mode="wait">
        {isMinimized ? (
          /* Mini Player - Natural Tones Style */
          <motion.div
            key="mini"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="h-full bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 flex items-center px-6 justify-between shadow-2xl relative overflow-hidden"
            onClick={() => setMinimized(false)}
          >
            {/* Progress Bar Over the Player */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
              <motion.div 
                className="h-full bg-accent shadow-[0_0_10px_rgba(153,102,204,0.5)]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-2 md:gap-4 w-1/2 md:w-1/3">
              <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                {/* Playing Glow Background */}
                <AnimatePresence>
                  {isPlaying && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1.2 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-accent/20 blur-md rounded-lg"
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    />
                  )}
                </AnimatePresence>
                <div className={cn(
                  "relative w-full h-full bg-white/10 rounded-lg overflow-hidden border transition-all duration-500",
                  isPlaying ? "border-accent/40 shadow-[0_0_15px_rgba(153,102,204,0.3)]" : "border-white/5"
                )}>
                  <motion.img 
                    src={currentAlbum.coverUrl || undefined} 
                    alt="" 
                    className="w-full h-full object-cover"
                    animate={{ 
                      opacity: isPlaying ? 1 : 0.6,
                      scale: isPlaying ? [1, 1.05, 1] : 1
                    }}
                    transition={{ 
                      opacity: { duration: 0.5 },
                      scale: isPlaying ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs md:text-sm font-medium truncate text-white">{currentAlbum.title}</span>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {currentAlbum.isDownloaded && (
                      <CheckCircle2 className="w-2 md:w-2.5 h-2 md:h-2.5 text-accent/60" />
                    )}
                    <span className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-tighter truncate">
                      {currentAlbum.tier === 'premium' ? 'Premium Experience' : 'Standard Journey'}
                    </span>
                  </div>
                  <RouterLink 
                    to={`/album/${currentAlbum.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-accent hover:text-white transition-all transform hover:scale-110"
                    title="Go to Album"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </RouterLink>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center gap-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticFeedback.light();
                    toggleShuffle();
                  }}
                  className={cn(
                    "transition-all p-2 transform hover:scale-110 active:scale-95",
                    isShuffled ? "text-accent" : "text-white/20 hover:text-white"
                  )}
                  aria-label="Shuffle"
                  title="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); previous(); }} 
                  className="text-white/40 hover:text-white transition-colors p-2"
                  aria-label="Previous Track"
                  title="Previous Track"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }}
                  className="relative group/play"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {/* Subtle Aura */}
                  <AnimatePresence>
                    {isPlaying && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.4, scale: 1.4 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-accent rounded-full blur-md"
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </AnimatePresence>
                  <div className="relative w-10 h-10 bg-accent rounded-full flex items-center justify-center text-black shadow-lg shadow-accent/20 hover:scale-110 active:scale-95 transition-all">
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </div>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); next(); }} 
                  className="text-white/40 hover:text-white transition-colors p-2"
                  aria-label="Next Track"
                  title="Next Track"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticFeedback.light();
                    toggleRepeat();
                  }}
                  className={cn(
                    "transition-all p-2 transform hover:scale-110 active:scale-95 relative group/repeat-mini",
                    repeatMode !== 'none' ? "text-accent" : "text-white/20 hover:text-white"
                  )}
                  aria-label={`Repeat: ${repeatMode}`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                  {repeatMode !== 'none' && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full shadow-[0_0_8px_rgba(212,187,255,0.8)]" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5 items-end h-4">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: isPlaying ? [4, 12, 6, 16, 4][i % 5] : 4 }}
                      transition={isPlaying ? { duration: 0.5, repeat: Infinity, delay: i * 0.1 } : { duration: 0.3 }}
                      className={cn(
                        "w-0.5 bg-primary",
                        i > 4 && "bg-white/20"
                      )}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 md:gap-6 w-1/2 md:w-1/3">
              <button 
                onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }}
                className="sm:hidden relative"
              >
                <AnimatePresence>
                  {isPlaying && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.4, scale: 1.4 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-primary rounded-full blur-md"
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </AnimatePresence>
                <div className="relative w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black shadow-lg shadow-primary/20">
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </div>
              </button>
              
              {/* Volume Control in Mini Player */}
              <div 
                className="hidden md:flex items-center group/volume relative h-full"
                onMouseEnter={() => setIsVolumeHovered(true)}
                onMouseLeave={() => setIsVolumeHovered(false)}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newVol = volume === 0 ? 0.8 : 0;
                    setVolume(newVol);
                    hapticFeedback.medium();
                  }}
                  className="p-2 text-white/30 hover:text-white transition-colors relative z-20"
                >
                  {volume === 0 ? <VolumeX className="w-5 h-5 text-primary/60" /> : <Volume2 className="w-5 h-5" />}
                  {volume > 0 && (
                    <motion.div 
                      layoutId="volume-pulsar"
                      className="absolute inset-0 bg-primary/20 blur-lg rounded-full -z-10"
                      animate={{ 
                        scale: isVolumeHovered ? [1.2, 1.6, 1.2] : [1, 1.2, 1], 
                        opacity: isVolumeHovered ? [0.4, 0.6, 0.4] : [0.1, 0.2, 0.1] 
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  )}
                </button>
                
                <div className="flex items-center pr-2 h-8 relative">
                  {/* Subtle track hint for discoverability when not hovered */}
                  {!isVolumeHovered && (
                    <motion.div 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 12 }}
                      className="h-1 bg-white/5 rounded-full ml-1"
                    />
                  )}
                  
                  <AnimatePresence>
                    {isVolumeHovered && (
                      <motion.div 
                        initial={{ width: 0, opacity: 0, x: -10 }}
                        animate={{ width: 100, opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: -10 }}
                        className="overflow-hidden flex items-center"
                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                      >
                        <div className="relative w-24 flex items-center h-8 px-2 group/slider-container">
                           <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const newVolume = parseFloat(e.target.value);
                              if (Math.abs(newVolume - volume) > 0.05) {
                                hapticFeedback.selection();
                              }
                              setVolume(newVolume);
                            }}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-transparent cursor-pointer hover:bg-white/20 transition-all relative z-10"
                          />
                          {/* Richer track highlight */}
                          <motion.div 
                            className="absolute h-1.5 bg-gradient-to-r from-primary/60 to-primary left-2 rounded-full pointer-events-none shadow-[0_0_10px_rgba(153,102,204,0.5)]"
                            style={{ width: `calc(${volume * 100}% - 4px)` }}
                            animate={{ 
                              backgroundColor: volume > 0.8 ? "#ff4444" : "#9966cc",
                            }}
                          />
                          {/* Animated Thumb Indicator */}
                          <motion.div 
                            className="absolute w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none z-20 border-2 border-primary"
                            style={{ left: `calc(${volume * 100}% + 2px)` }}
                            initial={false}
                            animate={{ 
                              scale: isVolumeHovered ? 1.2 : 1,
                              x: "-50%"
                            }}
                          />
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                             <span className="text-[7px] font-bold text-primary font-mono tracking-tighter opacity-80">{Math.round(volume * 100)}%</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(currentAlbum.id);
                  hapticFeedback.medium();
                }}
                className={cn(
                  "flex flex-col items-center gap-1 group transition-colors",
                  favorites.includes(currentAlbum.id) ? "text-accent" : "text-white/30 hover:text-white"
                )}
              >
                <div className="transition-transform group-hover:scale-110 active:scale-95">
                   <Heart className={cn("w-5 h-5", favorites.includes(currentAlbum.id) ? "fill-current" : "")} />
                </div>
                <span className="text-[8px] font-bold uppercase opacity-60">
                  {favorites.includes(currentAlbum.id) ? 'Liked' : 'Like'}
                </span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                disabled={isDownloading}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all group",
                  offlineAlbums.includes(currentAlbum.id) ? "text-primary" : "text-white/30 hover:text-white"
                )}
              >
                <div className="relative">
                  {isDownloading ? (
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      <svg className="absolute -inset-1 w-7 h-7 -rotate-90">
                        <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/10" />
                        <motion.circle 
                          cx="14" cy="14" r="11" fill="none" stroke="var(--color-primary)" strokeWidth="1.5"
                          strokeDasharray={2 * Math.PI * 11}
                          initial={{ strokeDashoffset: 2 * Math.PI * 11 }}
                          animate={{ strokeDashoffset: (2 * Math.PI * 11) * (1 - downloadProgress) }}
                        />
                      </svg>
                      <Download className="w-3 h-3 animate-pulse" />
                    </div>
                  ) : offlineAlbums.includes(currentAlbum.id) ? (
                    <CheckCircle2 className="w-5 h-5 shadow-[0_0_10px_rgba(153,102,204,0.4)]" />
                  ) : (
                    <Download className="w-5 h-5 transition-transform group-hover:scale-110" />
                  )}
                </div>
                <span className="text-[8px] font-bold uppercase text-white/40">
                  {isDownloading ? `${Math.round(downloadProgress * 100)}%` : offlineAlbums.includes(currentAlbum.id) ? 'Saved' : 'Off'}
                </span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsQueueOpen(true); }}
                className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-colors"
              >
                <ListMusic className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase text-white/40">Queue</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPlaylistModalOpen(true); }}
                className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-colors"
              >
                <PlusCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="text-[8px] font-bold uppercase text-white/40">Add</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* Fullscreen Immersive Player */
          <motion.div
            key="full"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-black z-[70] flex flex-col overflow-hidden"
          >
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0 text-white">
              <img 
                src={currentAlbum.coverUrl || undefined} 
                className="w-full h-full object-cover opacity-20 blur-3xl scale-110" 
                alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              <AudioVisualizer analyzer={analyzerRef.current} isPlaying={isPlaying} />
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 flex justify-between items-center">
              <button 
                onClick={() => setMinimized(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronDown className="w-6 h-6 text-white" />
              </button>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Immersive Experience</p>
                <h3 className="text-sm font-medium text-white/60">Now Playing</h3>
              </div>
              <button 
                onClick={() => setIsQueueOpen(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ListMusic className="w-6 h-6 text-white" />
              </button>
              <button 
                onClick={() => setIsPlaylistModalOpen(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ListPlus className="w-6 h-6 text-primary" />
              </button>
            </div>

            {/* Main Content Area - Split between Player and Queue if Open */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center overflow-hidden">
               {/* Full Player View */}
               <div className="flex flex-col items-center">
                <motion.div 
                  animate={isPlaying ? { 
                    scale: 1 + (frequencyValue * 0.05),
                    rotate: (frequencyValue * 2) - 1,
                    y: [0, -8, 0],
                    x: (frequencyValue * 10) - 5,
                  } : { scale: 1, rotate: 0, y: 0, x: 0 }}
                  transition={isPlaying ? { 
                    y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                    scale: { type: "spring", damping: 10, stiffness: 100 },
                    rotate: { type: "spring", damping: 10, stiffness: 100 },
                    x: { type: "spring", damping: 10, stiffness: 100 }
                  } : { duration: 0.5 }}
                  className="w-72 h-72 sm:w-96 sm:h-96 rounded-3xl relative mb-12"
                >
                  {/* Cinematic Blur Background Glow */}
                  <motion.div 
                    animate={isPlaying ? {
                      scale: 1.1 + (frequencyValue * 0.15),
                      opacity: 0.3 + (frequencyValue * 0.4),
                      rotate: [0, -2, 2, 0]
                    } : { scale: 1.1, opacity: 0.4, rotate: 0 }}
                    transition={isPlaying ? {
                      rotate: { duration: 10, repeat: Infinity, ease: "easeInOut" },
                      scale: { type: "spring", damping: 15, stiffness: 50 },
                      opacity: { duration: 0.2 }
                    } : { duration: 0.5 }}
                    className="absolute inset-4 blur-2xl pointer-events-none"
                  >
                    <img src={currentAlbum.coverUrl || undefined} className="w-full h-full object-cover rounded-3xl" alt="" />
                  </motion.div>
                  
                  <motion.div 
                    animate={isPlaying ? {
                      boxShadow: `0 0 ${25 + (frequencyValue * 50)}px rgba(153, 102, 204, ${0.2 + (frequencyValue * 0.4)})`,
                      borderColor: `rgba(153, 102, 204, ${0.3 + (frequencyValue * 0.5)})`
                    } : { boxShadow: '0 0 20px rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.2)' }}
                    className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl ring-1 cinematic-glow border-2 transition-colors duration-200"
                  >
                    <img src={currentAlbum.coverUrl || undefined} className="w-full h-full object-cover" alt="" />
                    
                    {/* Inner Glowing Border Overlay */}
                    {isPlaying && (
                      <motion.div 
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-3xl border border-primary/20 pointer-events-none"
                      />
                    )}
                  </motion.div>
                </motion.div>

                <div className="max-w-md w-full px-4 relative">
                  <div className="flex flex-col items-center">
                    <h2 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-4 italic leading-tight">{currentAlbum.title}</h2>
                    
                    <button 
                      onClick={() => {
                        hapticFeedback.light();
                        toggleLike(currentAlbum.id);
                      }}
                      className={cn(
                        "flex items-center gap-2 mb-6 px-4 py-2 rounded-full border transition-all",
                        favorites.includes(currentAlbum.id) 
                          ? "bg-accent/10 border-accent/30 text-accent" 
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                      )}
                    >
                      <Heart className={cn("w-4 h-4", favorites.includes(currentAlbum.id) ? "fill-current" : "")} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {favorites.includes(currentAlbum.id) ? 'Saved to Atmosphere' : 'Add to Liked'}
                      </span>
                    </button>
                  </div>
                  
                  <div className="flex justify-center mb-6">
                    <RouterLink 
                      to={`/album/${currentAlbum.id}`}
                      onClick={() => setMinimized(true)}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary transition-all group hover:scale-105 active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Go to Experience Hub</span>
                    </RouterLink>
                  </div>
                  
                  <div className="w-full px-8">
                    <p className="text-sm text-white/50 leading-relaxed italic font-light line-clamp-3">
                      {currentAlbum.description}
                    </p>
                  </div>
                </div>
               </div>
            </div>

            {/* Controls */}
            <div className="relative z-10 p-6 md:p-10 flex flex-col items-center gap-4 md:gap-6 bg-black/40 backdrop-blur-md">
              {/* Progress Slider / Waveform */}
              <div className="w-full max-w-4xl group flex flex-col gap-2 md:gap-4">
                <div className="h-24 md:h-36">
                  <WaveformSeekbar 
                    progress={progress}
                    isPlaying={isPlaying}
                    onSeek={handleSeekValue}
                    albumId={currentAlbum.id}
                    frequencyValue={frequencyValue}
                    duration={duration}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest px-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Buttons */}
              <div className="flex items-center gap-4 sm:gap-10">
                <button 
                  onClick={() => {
                    hapticFeedback.light();
                    toggleShuffle();
                  }}
                  className={cn(
                    "transition-all p-2 transform hover:scale-110 active:scale-95",
                    isShuffled ? "text-primary" : "text-white/40 hover:text-white"
                  )}
                  aria-label="Shuffle"
                  title="Shuffle"
                >
                  <Shuffle className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    hapticFeedback.light();
                    previous();
                  }}
                  className="text-white/60 hover:text-white transition-colors transform hover:scale-110 active:scale-90 p-2"
                  aria-label="Previous Track"
                  title="Previous Track"
                >
                  <SkipBack className="w-10 h-10 fill-current" />
                </button>
                <button 
                  onClick={handleTogglePlay}
                  className="relative group/mainplay"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  <AnimatePresence>
                    {isPlaying && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 bg-primary rounded-full blur-xl"
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </AnimatePresence>
                  <div className="relative w-24 h-24 rounded-full bg-primary text-black flex items-center justify-center shadow-2xl transform hover:scale-110 active:scale-95 transition-all ring-1 ring-white/20">
                    {isPlaying ? (
                      <Pause className="w-10 h-10 fill-current" />
                    ) : (
                      <Play className="w-10 h-10 fill-current ml-2" />
                    )}
                  </div>
                </button>
                <button 
                  onClick={() => {
                    hapticFeedback.light();
                    next();
                  }}
                  className="text-white/60 hover:text-white transition-colors transform hover:scale-110 active:scale-90 p-2"
                  aria-label="Next Track"
                  title="Next Track"
                >
                  <SkipForward className="w-10 h-10 fill-current" />
                </button>
                <button 
                  onClick={() => {
                    hapticFeedback.light();
                    toggleRepeat();
                  }}
                  className={cn(
                    "transition-all p-2 transform hover:scale-110 active:scale-95 relative group",
                    repeatMode !== 'none' ? "text-primary" : "text-white/40 hover:text-white"
                  )}
                  aria-label={`Repeat: ${repeatMode}`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                  
                  {/* Subtle glow when active */}
                  {repeatMode !== 'none' && (
                    <motion.div 
                      layoutId="repeat-glow"
                      className="absolute inset-0 bg-primary/10 blur-xl rounded-full -z-10"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                    />
                  )}

                  {/* Mode Indicator Dot */}
                  <AnimatePresence>
                    {repeatMode !== 'none' && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0, y: 5 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 5 }}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(153,102,204,0.8)]"
                      />
                    )}
                  </AnimatePresence>

                  {/* Mode Label (Subtle) */}
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap pointer-events-none border border-white/10">
                    {repeatMode === 'none' ? 'Repeat Off' : repeatMode === 'all' ? 'Repeat All' : 'Repeat One'}
                  </span>
                </button>
                <div className="relative">
                  <button 
                    onClick={() => {
                      hapticFeedback.light();
                      setIsSleepTimerOpen(!isSleepTimerOpen);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all group",
                      sleepTimerRemaining !== null ? "text-primary" : "text-white/40 hover:text-white"
                    )}
                  >
                    <div className={cn(
                      "p-1 rounded-md transition-colors",
                      isSleepTimerOpen ? "bg-white/10" : "group-hover:bg-white/5"
                    )}>
                      <Clock className="w-6 h-6" />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">
                      {sleepTimerRemaining !== null ? formatTime(sleepTimerRemaining) : 'Timer'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isSleepTimerOpen && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setIsSleepTimerOpen(false)}
                          className="fixed inset-0 z-[100]"
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[110] backdrop-blur-xl"
                        >
                          <div className="p-4 border-b border-white/5">
                            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] text-center">Sleep Timer</h3>
                          </div>
                          <div className="p-2 grid grid-cols-2 gap-1">
                            {[5, 10, 15, 30, 45, 60].map((min) => (
                              <button
                                key={min}
                                onClick={() => {
                                  hapticFeedback.selection();
                                  setSleepTimer(min);
                                }}
                                className="p-3 rounded-xl hover:bg-white/5 text-xs font-bold text-white transition-all text-center"
                              >
                                {min}m
                              </button>
                            ))}
                          </div>
                          {sleepTimerRemaining !== null && (
                            <button
                              onClick={cancelSleepTimer}
                              className="w-full p-4 text-[10px] font-bold text-red-400 bg-red-400/5 hover:bg-red-400/10 transition-all border-t border-white/5 uppercase tracking-widest"
                            >
                              Cancel Timer
                            </button>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Auto-play Next Toggle */}
                <button 
                  onClick={() => setAutoPlayNext(!autoPlayNext)}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all group",
                    autoPlayNext ? "text-primary" : "text-white/40 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "p-1 rounded-md transition-colors",
                    autoPlayNext ? "bg-primary/10" : "group-hover:bg-white/5"
                  )}>
                    <ListMusic className="w-6 h-6" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">
                    {autoPlayNext ? 'Auto-play ON' : 'Auto-play OFF'}
                  </span>
                </button>
              </div>

              {/* Volume & Extras */}
              <div className="flex items-center gap-8 w-full max-w-xl">
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => {
                      const newVol = volume === 0 ? 0.8 : 0;
                      setVolume(newVol);
                      hapticFeedback.medium();
                    }}
                    className="p-2 text-white/40 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                    aria-label={volume === 0 ? "Unmute" : "Mute"}
                  >
                    {volume === 0 ? <VolumeX className="w-6 h-6 text-primary" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                  
                  <div 
                    className="flex-1 relative group/vslider h-12 flex items-center"
                    onMouseEnter={() => setIsMainVolumeHovered(true)}
                    onMouseLeave={() => setIsMainVolumeHovered(false)}
                  >
                    {/* Background track ticks for discoverability/precision */}
                    <div className="absolute inset-x-0 h-1 flex justify-between px-1 pointer-events-none opacity-20">
                      {[...Array(11)].map((_, i) => (
                        <div key={i} className="w-0.5 h-full bg-white rounded-full" />
                      ))}
                    </div>

                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        if (Math.abs(newVolume - volume) > 0.05) {
                          hapticFeedback.selection();
                        }
                        setVolume(newVolume);
                      }}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none accent-transparent cursor-pointer transition-all relative z-10 hover:bg-white/15"
                    />
                    
                    <motion.div 
                      className="absolute top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/40 to-primary pointer-events-none shadow-[0_0_20px_rgba(153,102,204,0.4)]"
                      style={{ width: `${volume * 100}%` }}
                      animate={{ 
                        height: isMainVolumeHovered ? 10 : 8,
                        opacity: volume > 0 ? 1 : 0.3,
                        backgroundColor: volume > 0.9 ? "#ff4444" : "#9966cc"
                      }}
                    />

                    {/* Custom Animated Thumb */}
                    <motion.div 
                      className="absolute w-5 h-5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] pointer-events-none z-20 border-2 border-primary"
                      style={{ left: `${volume * 100}%` }}
                      initial={false}
                      animate={{ 
                        scale: isMainVolumeHovered ? 1.15 : 1,
                        x: "-50%",
                        y: "-50%",
                        top: "50%"
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                    
                    {/* Visual feedback indicator */}
                    <AnimatePresence>
                      {isMainVolumeHovered && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.9 }}
                          className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none"
                        >
                          <div className={cn(
                            "backdrop-blur-xl px-4 py-1.5 rounded-full border shadow-2xl flex items-center gap-2",
                            volume > 0.8 ? "bg-red-500/20 border-red-500/30" : "bg-primary/20 border-primary/30"
                          )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", volume > 0.8 ? "bg-red-500" : "bg-primary")} />
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-[0.2em] font-mono",
                              volume > 0.8 ? "text-red-400" : "text-primary"
                            )}>
                              {volume > 0.8 ? 'Intense' : volume > 0.4 ? 'Vibrant' : 'Ambient'}: {Math.round(volume * 100)}%
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <span className="text-[10px] font-mono text-white/40 w-10 text-right font-bold tabular-nums">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-6 border-l border-white/10 pl-8">
                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all relative group",
                      offlineAlbums.includes(currentAlbum.id) ? "text-primary" : "text-white/40 hover:text-white"
                    )}
                  >
                    <div className="relative">
                      {isDownloading && (
                        <svg className="absolute -inset-1.5 w-8 h-8 -rotate-90">
                          <circle
                            cx="16"
                            cy="16"
                            r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-white/10"
                          />
                          <motion.circle
                            cx="16"
                            cy="16"
                            r="14"
                            fill="none"
                            stroke="var(--color-primary)"
                            strokeWidth="2"
                            strokeDasharray={2 * Math.PI * 14}
                            initial={{ strokeDashoffset: 2 * Math.PI * 14 }}
                            animate={{ strokeDashoffset: (2 * Math.PI * 14) * (1 - downloadProgress) }}
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      <motion.div
                        animate={isDownloading ? { 
                          scale: [1, 1.1, 1],
                          opacity: [0.5, 1, 0.5]
                        } : {}}
                        transition={isDownloading ? { 
                          duration: 1.5, repeat: Infinity, ease: "easeInOut" 
                        } : {}}
                        className={cn(
                          "p-1 rounded-full transition-colors",
                          offlineAlbums.includes(currentAlbum.id) ? "bg-primary/10" : "group-hover:bg-white/5"
                        )}
                      >
                        {isDownloading ? (
                          <Download className="w-5 h-5 animate-bounce" />
                        ) : offlineAlbums.includes(currentAlbum.id) ? (
                          <CheckCircle2 className="w-5 h-5 shadow-[0_0_10px_rgba(153,102,204,0.4)]" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </motion.div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold uppercase tracking-tighter">
                        {isDownloading 
                          ? `${Math.round(downloadProgress * 100)}%` 
                          : offlineAlbums.includes(currentAlbum.id) ? 'Saved' : 'Reserve'}
                      </span>
                      {isDownloading && downloadEta !== null && (
                        <span className="text-[6px] font-mono opacity-40 uppercase tracking-widest mt-0.5">
                          ~{downloadEta}s
                        </span>
                      )}
                    </div>
                  </button>

                  {isOfflineMode ? (
                    <div className="flex flex-col items-center gap-1 text-primary">
                      <div className="p-1 rounded-md bg-primary/10">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-widest">Offline Mode</span>
                    </div>
                  ) : (
                    <QualitySelector 
                      currentLevel={preferredQuality}
                      onQualityChange={handleQualityChange}
                      levels={(activePlayer === 1 ? service1Ref : service2Ref).current.getAvailableLevels()}
                    />
                  )}

                  <button 
                    onClick={() => setIsDownloadsOpen(true)}
                    className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-all group"
                  >
                    <div className="p-1 rounded-md group-hover:bg-white/5 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest">Downloads</span>
                  </button>

                  <div className="relative">
                    <button 
                      onClick={() => setIsShareOpen(!isShareOpen)}
                      className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-all group"
                    >
                      <div className={cn(
                        "p-1 rounded-md transition-colors",
                        isShareOpen ? "bg-white/10 text-primary" : "group-hover:bg-white/5"
                      )}>
                        <Share2 className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-widest">Share</span>
                    </button>

                    <AnimatePresence>
                      {isShareOpen && (
                        <>
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsShareOpen(false)}
                            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9, rotateX: -10 }}
                            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9, rotateX: -10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="absolute bottom-full mb-6 right-0 w-72 bg-[#0a0a0a]/90 border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[110] backdrop-blur-2xl p-6"
                          >
                            <div className="mb-6 text-center">
                              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Universal Access</h3>
                              <p className="text-[8px] text-white/30 uppercase tracking-[0.1em]">Select transmission protocol</p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-6">
                              {[
                                { name: 'WhatsApp', icon: <WhatsAppIcon />, color: '#25D366', link: shareLinks.whatsapp },
                                { name: 'Twitter', icon: <Twitter />, color: '#1DA1F2', link: shareLinks.twitter },
                                { name: 'Facebook', icon: <Facebook />, color: '#1877F2', link: shareLinks.facebook },
                                { name: 'Instagram', icon: <Instagram />, color: '#E4405F', link: shareLinks.instagram },
                                { name: 'TikTok', icon: <TikTokIcon />, color: '#FFFFFF', link: shareLinks.tiktok },
                              ].map((platform) => (
                                <motion.a
                                  key={platform.name}
                                  href={platform.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  whileHover={{ scale: 1.1, y: -4 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setIsShareOpen(false)}
                                  className="flex flex-col items-center gap-2 group"
                                >
                                  <div 
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative"
                                    style={{ backgroundColor: `${platform.color}15` }}
                                  >
                                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity" style={{ backgroundColor: platform.color }} />
                                    <div className="relative z-10 transition-transform duration-300 group-hover:scale-110" style={{ color: platform.color }}>
                                      {React.cloneElement(platform.icon as React.ReactElement, { className: "w-6 h-6" })}
                                    </div>
                                  </div>
                                  <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">
                                    {platform.name}
                                  </span>
                                </motion.a>
                              ))}
                            </div>

                            <motion.button 
                              onClick={copyLink}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all relative overflow-hidden group",
                                copied ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/20"
                              )}
                            >
                              <AnimatePresence mode="wait">
                                {copied ? (
                                  <motion.div
                                    key="copied"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className="flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Link Encrypted</span>
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="copy"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className="flex items-center gap-2"
                                  >
                                    <Link className="w-4 h-4 text-primary" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Copy Frequency</span>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              
                              <motion.div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                              />
                            </motion.button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Playlist Modal */}
        <AnimatePresence>
          {isPlaylistModalOpen && (
            <PlaylistModal 
              isOpen={isPlaylistModalOpen}
              onClose={() => setIsPlaylistModalOpen(false)}
              album={currentAlbum}
            />
          )}
        </AnimatePresence>

        {/* Queue Drawer Overlay */}
      <AnimatePresence>
        {isQueueOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQueueOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#080808] border-l border-white/10 z-[90] flex flex-col"
            >
              <div className="p-6 flex flex-col gap-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h2 className="text-xl font-serif font-bold text-white italic">Playback Queue</h2>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                        {queue.length} Experiences Staged
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
                      <button 
                        onClick={() => {
                          hapticFeedback.light();
                          toggleShuffle();
                        }}
                        className={cn(
                          "p-2 rounded-md transition-all",
                          isShuffled ? "bg-primary/20 text-primary" : "text-white/20 hover:text-white"
                        )}
                        title="Shuffle Queue"
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          hapticFeedback.light();
                          toggleRepeat();
                        }}
                        className={cn(
                          "p-2 rounded-md transition-all relative",
                          repeatMode !== 'none' ? "bg-primary/20 text-primary" : "text-white/20 hover:text-white"
                        )}
                        title={`Repeat: ${repeatMode}`}
                      >
                        {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                        {repeatMode !== 'none' && (
                          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsQueueOpen(false)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Queue Search Interface - Refined with interaction feedback */}
                <div className="relative">
                  <motion.div 
                    initial={false}
                    animate={{ 
                      scale: queueSearch ? 1.01 : 1,
                      boxShadow: queueSearch ? "0 0 20px rgba(153,102,204,0.1)" : "0 0 0px rgba(0,0,0,0)"
                    }}
                    className="relative group overflow-hidden rounded-xl"
                  >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                    <div className="relative flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/10 group-focus-within:border-primary/40 group-focus-within:bg-white/[0.06] transition-all duration-300">
                      <div className="relative">
                        <Search className={cn(
                          "w-4 h-4 transition-colors duration-300",
                          queueSearch ? "text-primary" : "text-white/20 group-focus-within:text-primary/70"
                        )} />
                        {queueSearch && (
                          <motion.div 
                            layoutId="search-pulse"
                            className="absolute -inset-1 bg-primary/20 blur-md rounded-full -z-10"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                        )}
                      </div>
                      <input 
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search tracks in queue..."
                        value={queueSearch}
                        onChange={(e) => setQueueSearch(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-white/20 font-medium placeholder:italic tracking-wide"
                      />
                      <div className="flex items-center gap-2">
                        {queueSearch && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20"
                          >
                            <span className="text-[8px] font-bold text-primary tabular-nums">
                              {queue.filter(a => 
                                a.title.toLowerCase().includes(queueSearch.toLowerCase()) || 
                                a.artist.toLowerCase().includes(queueSearch.toLowerCase())
                              ).length}
                            </span>
                          </motion.div>
                        )}
                        {queueSearch ? (
                          <button 
                            onClick={() => setQueueSearch('')}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors group/clear"
                            title="Clear search (Esc)"
                          >
                            <X className="w-3 h-3 text-white/40 group-hover/clear:text-white" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 opacity-20 pointer-events-none group-focus-within:opacity-0 transition-opacity">
                            <kbd className="h-4 w-4 flex items-center justify-center rounded border border-white/20 text-[9px] font-mono">/</kbd>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {/* Now Playing in Queue */}
                <section>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Currently Active</h3>
                    <motion.div 
                      key={isPlaying ? 'playing' : 'paused'}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-2 py-0.5 rounded bg-white/5 border border-white/10"
                    >
                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                        {isPlaying ? 'Live Pulse' : 'Stationary'}
                      </span>
                    </motion.div>
                  </div>
                  <motion.div 
                    animate={isPlaying ? { 
                      boxShadow: ["0 0 20px rgba(153,102,204,0.05)", "0 0 40px rgba(153,102,204,0.15)", "0 0 20px rgba(153,102,204,0.05)"]
                    } : { boxShadow: "0 0 0px rgba(153,102,204,0)" }}
                    transition={isPlaying ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.5 }}
                    onMouseEnter={() => {
                      activeTooltipTimeoutRef.current = setTimeout(() => setShowActiveTooltip(true), 400);
                    }}
                    onMouseLeave={() => {
                      if (activeTooltipTimeoutRef.current) clearTimeout(activeTooltipTimeoutRef.current);
                      setShowActiveTooltip(false);
                    }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 relative overflow-hidden group shadow-lg cursor-help"
                  >
                     {/* Active Tooltip Overlay */}
                     <AnimatePresence>
                       {showActiveTooltip && (
                         <motion.div
                           initial={{ opacity: 0, x: -10, scale: 0.95 }}
                           animate={{ opacity: 1, x: 0, scale: 1 }}
                           exit={{ opacity: 0, x: -10, scale: 0.95 }}
                           className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-64 p-4 rounded-2xl bg-black/90 border border-primary/20 backdrop-blur-xl shadow-2xl z-[100] pointer-events-none"
                         >
                           <div className="space-y-3">
                             <div className="flex justify-between items-start gap-2">
                               <h5 className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] opacity-80">Currently Flowing</h5>
                               <div className="flex items-center gap-1 text-[9px] text-white/40 font-mono">
                                 <Clock className="w-2.5 h-2.5" />
                                 {formatTime(currentAlbum.duration)}
                               </div>
                             </div>
                             <p className="text-[10px] text-white/50 leading-relaxed italic font-light line-clamp-4">
                               {currentAlbum.description}
                             </p>
                             <div className="flex flex-wrap gap-1 pt-1 opacity-50">
                               {currentAlbum.moodTags.slice(0, 3).map(tag => (
                                 <span key={tag} className="text-[8px] text-white/60 lowercase italic">#{tag}</span>
                               ))}
                             </div>
                           </div>
                           {/* Tooltip Arrow */}
                           <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-black opacity-90 border-r border-t border-primary/20 rotate-45" />
                         </motion.div>
                       )}
                     </AnimatePresence>

                     {/* Dynamic Background Pulse */}
                     {isPlaying && (
                       <motion.div 
                         animate={{ opacity: [0.02, 0.08, 0.02] }}
                         transition={{ duration: 2, repeat: Infinity }}
                         className="absolute inset-0 bg-primary pointer-events-none"
                       />
                     )}

                     <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                        <img src={currentAlbum.coverUrl || undefined} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
                           <div className="flex gap-0.5 items-end h-7">
                              {[...Array(6)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ 
                                    height: isPlaying ? [6, 24, 12, 32, 8][i % 5] : 4,
                                    opacity: isPlaying ? [0.6, 1, 0.6] : 0.4
                                  }}
                                  transition={isPlaying ? { 
                                    height: { duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" },
                                    opacity: { duration: 1, repeat: Infinity, delay: i * 0.1 }
                                  } : { duration: 0.3 }}
                                  className="w-1.5 bg-primary rounded-t-full shadow-[0_0_12px_rgba(153,102,204,0.8)]"
                                />
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate italic tracking-tight">{currentAlbum.title}</h4>
                          {isPlaying && (
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-1.5 h-1.5 rounded-full bg-primary"
                            />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-0.5">
                           <p className="text-[9px] text-primary/70 uppercase tracking-[0.1em] truncate">
                              {currentAlbum.artist} <span className="mx-1 opacity-40">•</span> {currentAlbum.moodTags[0]}
                           </p>
                        </div>

                        <p className="text-[10px] text-white/30 line-clamp-1 italic mt-1">
                           {currentAlbum.description}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-1.5">
                           {currentAlbum.isDownloaded && (
                              <CheckCircle2 className="w-2.5 h-2.5 text-primary/40 shrink-0" />
                           )}
                           <p className="text-[9px] font-mono text-white/20">{formatTime(currentTime)} / {formatTime(duration)}</p>
                        </div>
                     </div>
                  </motion.div>
                </section>

                {/* Queue List */}
                <section>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Up Next</h3>
                    {queue.length > 0 && (
                      <button 
                        onClick={clearQueue}
                        className="text-[9px] font-bold text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear Queue
                      </button>
                    )}
                  </div>
                  
                  {queue.length === 0 ? (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-24 text-center flex flex-col items-center justify-center gap-8 px-4"
                      >
                        <div className="relative">
                        {/* Pulse Rings */}
                        <motion.div 
                          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150"
                        />
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                            className="absolute inset-0 border border-primary/30 rounded-full"
                          />
                          
                          <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-white/10 to-transparent flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-md">
                            <ListMusic className="w-10 h-10 text-white/20" />
                            <motion.div 
                              animate={{ y: [0, -4, 0], x: [0, 2, 0] }}
                              transition={{ duration: 4, repeat: Infinity }}
                              className="absolute -top-1 -right-1 p-2 rounded-full bg-primary text-black shadow-lg shadow-primary/30"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </motion.div>
                          </div>
                        </div>

                        <div className="space-y-4 max-w-[240px]">
                          <motion.h4 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg font-serif font-bold text-white italic"
                          >
                            Silence Awaits
                          </motion.h4>
                          <motion.p 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-[10px] text-white/40 uppercase tracking-[0.25em] leading-loose"
                          >
                            Your sequence is waiting for its first resonance. <br/>
                            <span className="text-primary">Staging a clip</span> from a series to build your journey.
                          </motion.p>
                        </div>
                      </motion.div>

                      <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={() => setIsQueueOpen(false)}
                        className="mt-4 px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white uppercase tracking-[0.3em] transition-all"
                      >
                        Explore Universes
                      </motion.button>
                    </>
                  ) : queue.filter(a => {
                      const query = queueSearch.toLowerCase();
                      return a.title.toLowerCase().includes(query) || 
                             a.artist.toLowerCase().includes(query) ||
                             a.description.toLowerCase().includes(query) ||
                             a.moodTags.some(tag => tag.toLowerCase().includes(query));
                    }).length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-20 text-center px-6"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-6 border border-primary/10 relative">
                        <Search className="w-6 h-6 text-primary/20" />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="absolute -top-1 -right-1 text-primary"
                        >
                          <X className="w-4 h-4" />
                        </motion.div>
                      </div>
                      <p className="text-sm text-white font-serif italic mb-2">No matching tracks found</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                        Adjust your search frequency <br/> to find your destination.
                      </p>
                      <button 
                        onClick={() => setQueueSearch('')}
                        className="mt-8 px-6 py-2 rounded-full border border-primary/20 text-[9px] font-bold text-primary uppercase tracking-[0.2em] hover:bg-primary hover:text-black transition-all"
                      >
                        Clear Filter
                      </button>
                    </motion.div>
                  ) : (
                    <Reorder.Group 
                      axis="y" 
                      values={queue} 
                      onReorder={reorderQueue}
                      className="space-y-2"
                    >
                      {queue
                        .filter(a => {
                          const query = queueSearch.toLowerCase();
                          return a.title.toLowerCase().includes(query) || 
                                 a.artist.toLowerCase().includes(query) ||
                                 a.description.toLowerCase().includes(query) ||
                                 a.moodTags.some(tag => tag.toLowerCase().includes(query));
                        })
                        .map((album, index) => (
                          <QueueItem 
                            key={album.id}
                            album={album}
                            isActive={currentAlbum.id === album.id}
                            onPlay={setAlbum}
                            onRemove={removeFromQueue}
                            index={index}
                            canReorder={!queueSearch}
                          />
                        ))}
                    </Reorder.Group>
                  )}
                </section>
              </div>

              {/* Bottom Info / Clear */}
              {queue.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-black/40">
                  <p className="text-[9px] text-white/30 uppercase tracking-widest text-center">
                    Drag items to reorder the sequence
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Premium Required Modal */}
      {/* Downloads Manager Overlay */}
      <AnimatePresence>
        {isDownloadsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDownloadsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#080808] border-l border-white/10 z-[90] flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div>
                  <h2 className="text-xl font-serif font-bold text-white italic">Offline Archives</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                    {offlineAlbums.length} Frequencies Synchronized
                  </p>
                </div>
                <button 
                  onClick={() => setIsDownloadsOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {offlineAlbums.length === 0 ? (
                  <div className="py-24 text-center flex flex-col items-center justify-center gap-6 px-4">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <Clock className="w-10 h-10 text-white/20" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40 font-bold uppercase tracking-widest">No Offline Discoveries</p>
                      <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] mt-2">Download universes to experience them without connectivity.</p>
                    </div>
                  </div>
                ) : (
                  MOCK_ALBUMS.filter(a => offlineAlbums.includes(a.id)).map((album) => (
                    <div 
                      key={album.id}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/5 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/5">
                        <img src={album.coverUrl || undefined} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate italic">{album.title}</h4>
                        <p className="text-[9px] text-primary truncate uppercase tracking-tighter mt-0.5">{album.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setAlbum(album);
                            setIsDownloadsOpen(false);
                          }}
                          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                        <button 
                          onClick={() => handleDeleteDownload(album.id)}
                          className="p-2 rounded-full bg-red-400/5 text-red-400/40 hover:bg-red-400/10 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPremiumModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
              
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 border border-primary/20 rounded-full animate-ping pointer-events-none" />
                  <Heart className="w-10 h-10 text-primary fill-current" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-white italic">Premium Experience</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest leading-loose">
                  This curated journey is reserved for our community of seekers. 
                  Unlock offline listening, high-fidelity HLS streaming, and exclusive universes.
                </p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    // Simulation of Stripe checkout
                    setShowPremiumModal(false);
                    usePlayerStore.getState().setUserTier('premium');
                  }}
                  className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 text-sm uppercase tracking-widest"
                >
                  Start Journey • $9.99/mo
                </button>
                <button 
                  onClick={() => setShowPremiumModal(false)}
                  className="w-full py-3 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={cn(
              "fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl backdrop-blur-xl border flex items-center gap-3 shadow-2xl min-w-[280px] max-w-[90vw]",
              toast.type === 'success' ? "bg-primary/10 border-primary/20 text-primary" : "bg-red-500/10 border-red-500/20 text-red-500"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </div>
            <span className="text-xs font-bold italic tracking-tight flex-1">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
