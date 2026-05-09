import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Maximize2, Minimize2,
  ChevronDown, Heart, Clock, ListMusic,
  GripVertical, X, Trash2, CheckCircle2,
  Zap, Share2, Twitter, Facebook, Link
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { MOCK_ALBUMS } from '../data/mockData';
import { formatTime, cn } from '../lib/utils';
import { streamingService } from '../services/streamingService';
import { offlineService } from '../services/offlineService';
import {
  DndContext, 
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Album } from '../types';

interface SortableQueueItemProps {
  album: Album;
  onRemove: (id: string) => void;
  onPlay: (album: Album) => void;
  isActive: boolean;
  index: number;
  key?: string;
}

function SortableQueueItem({ album, onRemove, onPlay, isActive, index }: SortableQueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over
  } = useSortable({ id: album.id });

  const isOver = over?.id === album.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative py-1 select-none">
      {/* Drop Indicator - Refined for "Natural Tones" theme */}
      <AnimatePresence>
        {isOver && !isDragging && (
          <motion.div 
            initial={{ opacity: 0, scaleX: 0, y: -5 }}
            animate={{ opacity: 1, scaleX: 1, y: 0 }}
            exit={{ opacity: 0, scaleX: 0, y: -5 }}
            className="absolute -top-1 left-2 right-2 h-0.5 z-20 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F4C430] to-transparent shadow-[0_0_15px_rgba(244,196,48,0.8)] rounded-full" />
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-bold text-[#F4C430] uppercase tracking-[0.4em] whitespace-nowrap bg-black/80 px-2 py-0.5 rounded-full border border-[#F4C430]/30 backdrop-blur-sm"
            >
              Release to Stage
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl transition-all group relative border",
          isActive 
            ? "bg-white/10 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/5 hover:border-white/10",
          isDragging && "opacity-0 scale-95", // Hide the ghost item roughly
          isOver && !isDragging && "translate-y-1 bg-white/10"
        )}
      >
        {/* Placeholder visual when dragging */}
        {isDragging && (
          <div className="absolute inset-0 bg-[#F4C430]/5 rounded-xl border border-dashed border-[#F4C430]/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F4C430]/20 animate-pulse" />
          </div>
        )}

        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-white/10 hover:text-white/40 transition-colors p-1 touch-none">
          <GripVertical className="w-4 h-4" />
        </div>
        
        <div 
          className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer shadow-lg"
          onClick={() => onPlay(album)}
        >
          <img src={album.coverUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
          {isActive && (
            <div className="absolute inset-0 bg-primary/40 flex items-center justify-center backdrop-blur-[1px]">
              <div className="flex gap-0.5 items-end h-4">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 12, 6, 16, 4][i % 5] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-white rounded-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlay(album)}>
          <h4 className={cn("text-xs font-bold truncate tracking-tight transition-colors", isActive ? "text-primary" : "text-white group-hover:text-primary")}>
            {album.title}
          </h4>
          <p className="text-[9px] text-white/40 line-clamp-1 mb-1 italic opacity-80">
            {album.description}
          </p>
          <div className="flex items-center gap-1.5">
            {album.isDownloaded && (
              <CheckCircle2 className="w-2.5 h-2.5 text-primary/60" />
            )}
            <p className="text-[9px] text-white/30 uppercase tracking-[0.15em] truncate">{album.artist} • {album.moodTags[0]}</p>
          </div>
        </div>

        <button 
          onClick={() => onRemove(album.id)}
          className="p-2 text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

interface WaveformSeekbarProps {
  progress: number;
  isPlaying: boolean;
  onSeek: (progress: number) => void;
  albumId: string;
}

function WaveformSeekbar({ progress, isPlaying, onSeek, albumId }: WaveformSeekbarProps) {
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

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

  return (
    <div 
      className="relative w-full h-36 flex items-center group touch-none select-none"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoverProgress((e.clientX - rect.left) / rect.width);
      }}
      onMouseLeave={() => setHoverProgress(null)}
    >
      {/* Background Glow Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
        <motion.div 
          className="absolute h-full w-48 blur-[80px] bg-gradient-to-r from-transparent via-[#F4C430]/20 to-transparent"
          style={{ left: `${progress * 100}%`, x: '-50%' }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-12 top-12 flex items-center justify-between gap-[2px] z-10">
        {points.map((height, i) => {
          const pointProgress = i / points.length;
          const isActive = progress >= pointProgress;
          const isHovered = hoverProgress !== null && Math.abs(hoverProgress - pointProgress) < 0.05;
          const distanceToPlayhead = Math.abs(progress - pointProgress);
          const isNearPlayhead = distanceToPlayhead < 0.1;
          
          return (
            <div key={i} className="flex-1 h-full flex flex-col items-center justify-center gap-[1px]">
              {/* Top half */}
              <motion.div
                initial={false}
                animate={{ 
                  height: `${height * 100}%`,
                  opacity: isActive ? 1 : isHovered ? 0.6 : 0.12,
                  backgroundColor: isActive ? '#F4C430' : '#ffffff',
                  boxShadow: (isActive && isNearPlayhead) ? '0 0 15px rgba(244,196,48,0.6)' : 'none',
                  scale: (isPlaying && isNearPlayhead) ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  duration: 0.25,
                  scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                }}
                className={cn(
                  "w-full rounded-t-[1px] transition-colors duration-500",
                  isActive && "shadow-[0_0_8px_rgba(244,196,48,0.2)]"
                )}
              />
              {/* Bottom half (mirrored reflection) */}
              <motion.div
                initial={false}
                animate={{ 
                  height: `${height * 50}%`,
                  opacity: isActive ? 0.4 : isHovered ? 0.2 : 0.05,
                  backgroundColor: isActive ? '#F4C430' : '#ffffff',
                  filter: 'blur(0.5px)',
                  scale: (isPlaying && isNearPlayhead) ? [1, 1.05, 1] : 1
                }}
                transition={{ 
                  duration: 0.3,
                  scale: { repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.1 }
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
        value={progress}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40"
      />

      {/* Playhead Indicator with Custom Glow */}
      <motion.div 
        className="absolute top-0 bottom-0 w-[3px] bg-[#F4C430] z-30 pointer-events-none"
        style={{ left: `${progress * 100}%`, x: '-50%' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 -translate-y-1/2 bg-[#F4C430] blur-xl opacity-40 rounded-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 translate-y-1/2 bg-[#F4C430] blur-xl opacity-40 rounded-full" />
        
        {/* Playhead Bead */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_15px_#F4C430] ring-4 ring-[#F4C430]/30"
          animate={{ scale: isPlaying ? [1, 1.3, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.div>
    </div>
  );
}

interface QualitySelectorProps {
  onQualityChange: (level: number) => void;
  currentLevel: number;
}

function QualitySelector({ onQualityChange, currentLevel }: QualitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const levels = streamingService.getAvailableLevels();

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
          isOpen ? "bg-white/10 text-[#F4C430]" : "group-hover:bg-white/5"
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
                    currentLevel === -1 ? "bg-[#F4C430]/10 border border-[#F4C430]/20" : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="text-left">
                    <p className={cn("text-xs font-bold", currentLevel === -1 ? "text-[#F4C430]" : "text-white")}>Auto Adaptive</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">Network Optimized</p>
                  </div>
                  {currentLevel === -1 && <div className="w-1.5 h-1.5 rounded-full bg-[#F4C430] shadow-[0_0_8px_#F4C430]" />}
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
                      currentLevel === i ? "bg-[#F4C430]/10 border border-[#F4C430]/20" : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className="text-left">
                      <p className={cn("text-xs font-bold", currentLevel === i ? "text-[#F4C430]" : "text-white")}>{getLabel(i)}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{getSubLabel(i)}</p>
                    </div>
                    {currentLevel === i && <div className="w-1.5 h-1.5 rounded-full bg-[#F4C430] shadow-[0_0_8px_#F4C430]" />}
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

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();
  const { 
    currentAlbum, isPlaying, progress, currentTime, duration, 
    volume, isMinimized, queue, togglePlay, setProgress, setCurrentTime, 
    setDuration, setMinimized, setVolume, next, previous, reorderQueue, removeFromQueue, setAlbum, clearQueue,
    userTier, offlineAlbums, refreshOfflineStatus, preferredQuality, setPreferredQuality,
    autoPlayNext, setAutoPlayNext
  } = usePlayerStore();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  const handleDeleteDownload = async (albumId: string) => {
    await offlineService.deleteAlbum(albumId);
    const updatedIds = await offlineService.getOfflineAlbumIds();
    refreshOfflineStatus(updatedIds);
  };
  
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Listening to ${currentAlbum?.title} by ${currentAlbum?.artist} on DsquareGee | Carnatic Revolution`)}&url=${encodeURIComponent(window.location.origin + '/album/' + currentAlbum?.id)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/album/' + currentAlbum?.id)}`,
  };

  const copyLink = () => {
    if (!currentAlbum) return;
    const link = `${window.location.origin}/album/${currentAlbum.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setIsShareOpen(false);
    });
  };
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadEta, setDownloadEta] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const lastOfflineUrlRef = useRef<string | null>(null);
  
  // Sleep Timer state
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

  const [frequencyValue, setFrequencyValue] = useState(0);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Audio Analysis for Parallax Effect
  useEffect(() => {
    if (!audioRef.current || !isHydrated) return;

    let audioCtx: AudioContext | null = null;

    const setupAnalyzer = () => {
      try {
        if (!analyzerRef.current) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          if (!sourceNodeRef.current) {
            sourceNodeRef.current = audioCtx.createMediaElementSource(audioRef.current!);
          }
          
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32;
          sourceNodeRef.current.connect(analyser);
          analyser.connect(audioCtx.destination);
          analyzerRef.current = analyser;
        }

        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        const update = () => {
          if (analyzerRef.current && isPlaying) {
            analyzerRef.current.getByteFrequencyData(dataArray);
            // Get average of mid-low frequencies for a "pulse" feel
            const avg = (dataArray[1] + dataArray[2] + dataArray[3]) / 3;
            setFrequencyValue(avg / 255);
          } else {
            setFrequencyValue(0);
          }
          animationFrameRef.current = requestAnimationFrame(update);
        };
        update();
      } catch (e) {
        console.warn('Audio analyzer could not be initialized (likely due to user gesture requirements)', e);
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
  }, [location.pathname]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Initialize HLS
  useEffect(() => {
    if (audioRef.current) {
      streamingService.initialize(audioRef.current);
    }
    return () => {
      streamingService.destroy();
      if (lastOfflineUrlRef.current) {
        URL.revokeObjectURL(lastOfflineUrlRef.current);
      }
    };
  }, []);

  // Handle source changes with HLS and Resume from state
  useEffect(() => {
    const initializeSource = async () => {
      if (isHydrated && currentAlbum && audioRef.current) {
        let sourceUrl = currentAlbum.hlsUrl;
        let isUsingOffline = false;
        
        // Revoke previous blob URL if exists
        if (lastOfflineUrlRef.current) {
          URL.revokeObjectURL(lastOfflineUrlRef.current);
          lastOfflineUrlRef.current = null;
        }

        // Check if album is available offline
        if (offlineAlbums.includes(currentAlbum.id)) {
          try {
            const offlineUrl = await offlineService.getOfflineUrl(currentAlbum.id);
            if (offlineUrl) {
              sourceUrl = offlineUrl;
              lastOfflineUrlRef.current = offlineUrl;
              isUsingOffline = true;
            }
          } catch (err) {
            console.error('Failed to load offline source', err);
          }
        }

        setIsOfflineMode(isUsingOffline);
        streamingService.loadSource(sourceUrl);
        
        // Resume playback position
        if (currentTime > 0) {
          audioRef.current.currentTime = currentTime;
        }

        // Resume quality preference
        if (preferredQuality !== -1 && !isUsingOffline) {
          streamingService.switchQuality(preferredQuality);
        }

        if (isPlaying) {
          audioRef.current.play().catch(console.error);
        }
      }
    };

    initializeSource();
  }, [currentAlbum?.id, isHydrated, offlineAlbums.length]); // Use length to avoid re-triggering on every array change unless a download happened

  // Premium event listener
  useEffect(() => {
    const handlePremiumReq = () => setShowPremiumModal(true);
    window.addEventListener('premium-required', handlePremiumReq);
    return () => window.removeEventListener('premium-required', handlePremiumReq);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((item) => item.id === active.id);
      const newIndex = queue.findIndex((item) => item.id === over.id);
      reorderQueue(arrayMove(queue, oldIndex, newIndex));
    }
  };

  const activeDraggingAlbum = queue.find(a => a.id === activeDragId);

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
    } catch (error) {
      console.error('Download failed', error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadEta(null);
    }
  };

  // Sync isPlaying state
  useEffect(() => {
    if (!audioRef.current || !currentAlbum) return;

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle progress updates
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    setCurrentTime(time);
    if (dur) {
      setDuration(dur);
      setProgress(time / dur);
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
    streamingService.switchQuality(level);
    setPreferredQuality(level);
  };

  if (!isHydrated || !currentAlbum) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] h-24 px-8 pb-4">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => autoPlayNext && next()}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
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
                className="h-full bg-[#F4C430] shadow-[0_0_10px_rgba(244,196,48,0.5)]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-4 w-1/3">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex-shrink-0 overflow-hidden border border-white/5">
                <img src={currentAlbum.coverUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate text-white">{currentAlbum.title}</span>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {currentAlbum.isDownloaded && (
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#F4C430]/60" />
                  )}
                  <span className="text-[10px] text-white/40 uppercase tracking-tighter truncate">
                    {currentAlbum.artist} • {currentAlbum.moodTags[0]}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center gap-6">
                <button onClick={(e) => { e.stopPropagation(); previous(); }} className="text-white/40 hover:text-white transition-colors">
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-10 h-10 bg-[#F4C430] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#F4C430]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); next(); }} className="text-white/40 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5 items-end h-4">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: isPlaying ? [4, 12, 6, 16, 4][i % 5] : 4 }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className={cn(
                        "w-0.5 bg-[#F4C430]",
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

            <div className="flex items-center justify-end gap-6 w-1/3">
              <button className="flex flex-col items-center gap-1 group">
                <div className="text-[#D4AF37] group-hover:text-[#F4C430] transition-colors">
                   <Heart className="w-5 h-5" />
                </div>
                <span className="text-[8px] font-bold uppercase opacity-60">Save</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsQueueOpen(true); }}
                className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-colors"
              >
                <ListMusic className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase text-white/40">Queue</span>
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
                src={currentAlbum.coverUrl} 
                className="w-full h-full object-cover opacity-20 blur-3xl scale-110" 
                alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
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
                <p className="text-[10px] uppercase tracking-widest text-[#F4C430] font-bold">Immersive Experience</p>
                <h3 className="text-sm font-medium text-white/60">Now Playing</h3>
              </div>
              <button 
                onClick={() => setIsQueueOpen(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ListMusic className="w-6 h-6 text-white" />
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
                    <img src={currentAlbum.coverUrl} className="w-full h-full object-cover rounded-3xl" alt="" />
                  </motion.div>
                  
                  <motion.div 
                    animate={isPlaying ? {
                      boxShadow: `0 0 ${20 + (frequencyValue * 40)}px rgba(244, 196, 48, ${0.1 + (frequencyValue * 0.2)})`
                    } : { boxShadow: '0 0 20px rgba(0,0,0,0.4)' }}
                    className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 cinematic-glow"
                  >
                    <img src={currentAlbum.coverUrl} className="w-full h-full object-cover" alt="" />
                  </motion.div>
                </motion.div>

                <div className="max-w-md w-full">
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-2 italic">{currentAlbum.title}</h2>
                  <div className="flex items-center justify-center gap-3 mb-6">
                    {currentAlbum.isDownloaded && (
                      <CheckCircle2 className="w-4 h-4 text-[#F4C430]/60" />
                    )}
                    <p className="text-lg text-[#F4C430] font-medium uppercase tracking-[0.2em]">{currentAlbum.artist}</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {currentAlbum.moodTags.map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-[10px] uppercase font-bold tracking-tighter text-white/60 border border-white/10 italic">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Collapsible Album Insight */}
                  <div className="w-full">
                    <button 
                      onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                      className="flex items-center gap-2 mx-auto text-white/40 hover:text-[#F4C430] transition-all group"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{isInfoExpanded ? 'Retract Insight' : 'Album Insight'}</span>
                      <motion.div
                        animate={{ rotate: isInfoExpanded ? 180 : 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isInfoExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, scale: 0.95 }}
                          animate={{ height: 'auto', opacity: 1, scale: 1 }}
                          exit={{ height: 0, opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                          className="overflow-hidden mt-6"
                        >
                          <div className="px-8 py-10 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-left space-y-8 max-w-sm mx-auto shadow-2xl relative">
                            {/* Decorative background pulse */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4C430]/5 rounded-full blur-3xl -z-10" />
                            
                            <div>
                              <h4 className="text-[10px] font-bold text-[#F4C430] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <span className="w-4 h-px bg-[#F4C430]/30" />
                                Manifesto
                              </h4>
                              <p className="text-xs text-white/70 leading-relaxed italic font-light">{currentAlbum.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-10">
                              <div>
                                <h4 className="text-[10px] font-bold text-[#F4C430] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                  <span className="w-4 h-px bg-[#F4C430]/30" />
                                  Ensemble
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {currentAlbum.instruments.map(inst => (
                                    <span key={inst} className="text-[10px] text-white/50 lowercase tracking-wide bg-white/5 px-2 py-0.5 rounded-sm">{inst}</span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-bold text-[#F4C430] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                  <span className="w-4 h-px bg-[#F4C430]/30" />
                                  Atmosphere
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {currentAlbum.moodTags.map(tag => (
                                    <span key={tag} className="text-[10px] text-white/50 lowercase tracking-wide italic">#{tag}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
               </div>
            </div>

            {/* Controls */}
            <div className="relative z-10 p-10 flex flex-col items-center gap-6 bg-black/40 backdrop-blur-md">
              {/* Progress Slider / Waveform */}
              <div className="w-full max-w-4xl group flex flex-col gap-4">
                <WaveformSeekbar 
                  progress={progress}
                  isPlaying={isPlaying}
                  onSeek={handleSeekValue}
                  albumId={currentAlbum.id}
                />
                <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest px-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Buttons */}
              <div className="flex items-center gap-10">
                <button className="text-white/40 hover:text-white transition-colors">
                  <Heart className="w-6 h-6" />
                </button>
                <button 
                  onClick={previous}
                  className="text-white/60 hover:text-white transition-colors transform active:scale-90"
                >
                  <SkipBack className="w-10 h-10 fill-current" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-24 h-24 rounded-full bg-[#F4C430] text-black flex items-center justify-center shadow-2xl transform hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-10 h-10 fill-current" />
                  ) : (
                    <Play className="w-10 h-10 fill-current ml-2" />
                  )}
                </button>
                <button 
                  onClick={next}
                  className="text-white/60 hover:text-white transition-colors transform active:scale-90"
                >
                  <SkipForward className="w-10 h-10 fill-current" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setIsSleepTimerOpen(!isSleepTimerOpen)}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all group",
                      sleepTimerRemaining !== null ? "text-[#F4C430]" : "text-white/40 hover:text-white"
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
                                onClick={() => setSleepTimer(min)}
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
                    autoPlayNext ? "text-[#F4C430]" : "text-white/40 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "p-1 rounded-md transition-colors",
                    autoPlayNext ? "bg-[#F4C430]/10" : "group-hover:bg-white/5"
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
                <div className="flex items-center gap-3 flex-1">
                  <Volume2 className="w-5 h-5 text-white/40" />
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none accent-white/40 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-6 border-l border-white/10 pl-8">
                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all",
                      offlineAlbums.includes(currentAlbum.id) ? "text-[#F4C430]" : "text-white/40 hover:text-white"
                    )}
                  >
                    <motion.div
                      animate={isDownloading ? { 
                        rotate: 360,
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={isDownloading ? { 
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                      } : {}}
                    >
                      <Clock className="w-5 h-5" />
                    </motion.div>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold uppercase tracking-tighter">
                        {isDownloading 
                          ? `Caching ${Math.round(downloadProgress * 100)}%` 
                          : offlineAlbums.includes(currentAlbum.id) ? 'Offline' : 'Pre-cache'}
                      </span>
                      {isDownloading && downloadEta !== null && (
                        <span className="text-[6px] font-mono opacity-40 uppercase tracking-widest mt-0.5">
                          ~{downloadEta}s remaining
                        </span>
                      )}
                    </div>
                  </button>

                  {isOfflineMode ? (
                    <div className="flex flex-col items-center gap-1 text-[#F4C430]">
                      <div className="p-1 rounded-md bg-[#F4C430]/10">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-widest">Offline Mode</span>
                    </div>
                  ) : (
                    <QualitySelector 
                      currentLevel={preferredQuality}
                      onQualityChange={handleQualityChange}
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
                        isShareOpen ? "bg-white/10 text-[#F4C430]" : "group-hover:bg-white/5"
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
                            className="fixed inset-0 z-[100]"
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full mb-4 right-0 w-48 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[110] backdrop-blur-xl"
                          >
                            <div className="p-4 border-b border-white/5">
                              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Transmit frequency</h3>
                            </div>
                            <div className="p-2 space-y-1">
                              <a 
                                href={shareLinks.twitter} 
                                target="_blank" 
                                rel="noreferrer"
                                onClick={() => setIsShareOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
                              >
                                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                                <span className="text-xs font-bold text-white uppercase tracking-widest">X / Twitter</span>
                              </a>
                              <a 
                                href={shareLinks.facebook} 
                                target="_blank" 
                                rel="noreferrer"
                                onClick={() => setIsShareOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
                              >
                                <Facebook className="w-4 h-4 text-[#1877F2]" />
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Facebook</span>
                              </a>
                              <button 
                                onClick={copyLink}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
                              >
                                <Link className="w-4 h-4 text-[#F4C430]" />
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Copy Connection</span>
                              </button>
                            </div>
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
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div>
                  <h2 className="text-xl font-serif font-bold text-white italic">Playback Queue</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                    {queue.length} Experiences Staged
                  </p>
                </div>
                <button 
                  onClick={() => setIsQueueOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {/* Now Playing in Queue */}
                <section>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-bold text-[#F4C430] uppercase tracking-[0.3em]">Currently Active</h3>
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
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#F4C430]/10 to-transparent border border-[#F4C430]/20 shadow-[0_0_20px_rgba(244,196,48,0.05)]">
                     <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg">
                        <img src={currentAlbum.coverUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                           <div className="flex gap-0.5 items-end h-6">
                              {[...Array(5)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ height: isPlaying ? [4, 20, 10, 24, 6][i % 5] : 4 }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                  className="w-1 bg-[#F4C430] rounded-t-full shadow-[0_0_8px_rgba(244,196,48,0.6)]"
                                />
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate italic tracking-tight">{currentAlbum.title}</h4>
                        <p className="text-[10px] text-[#F4C430]/70 line-clamp-1 italic mt-0.5">
                           {currentAlbum.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                           {currentAlbum.isDownloaded && (
                              <CheckCircle2 className="w-2.5 h-2.5 text-[#F4C430]/60" />
                           )}
                           <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">{currentAlbum.artist}</p>
                        </div>
                     </div>
                  </div>
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
                          className="absolute inset-0 bg-[#F4C430]/20 rounded-full blur-xl scale-150"
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                          className="absolute inset-0 border border-[#F4C430]/30 rounded-full"
                        />
                        
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-white/10 to-transparent flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-md">
                          <ListMusic className="w-10 h-10 text-white/20" />
                          <motion.div 
                            animate={{ y: [0, -4, 0], x: [0, 2, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute -top-1 -right-1 p-2 rounded-full bg-[#F4C430] text-black shadow-lg shadow-[#F4C430]/30"
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
                          <span className="text-[#F4C430]">Staging a clip</span> from a series to build your journey.
                        </motion.p>
                      </div>

                      <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={() => setIsQueueOpen(false)}
                        className="mt-4 px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white uppercase tracking-[0.3em] transition-all"
                      >
                        Explore Universes
                      </motion.button>
                    </motion.div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={queue.map(a => a.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {queue.map((album, index) => (
                            <SortableQueueItem 
                              key={album.id}
                              album={album}
                              isActive={false}
                              onPlay={setAlbum}
                              onRemove={removeFromQueue}
                              index={index}
                            />
                          ))}
                        </div>
                      </SortableContext>
                      
                      <DragOverlay dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                          styles: {
                            active: {
                              opacity: '0.4',
                            },
                          },
                        }),
                      }}>
                        {activeDraggingAlbum ? (
                          <motion.div 
                            initial={{ scale: 1, rotate: 0 }}
                            animate={{ scale: 1.02, rotate: -1.5, y: -5 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/30 shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-[200] cursor-grabbing w-[calc(100%-2rem)] max-w-sm ring-2 ring-white/10"
                          >
                            <div className="text-white/40 p-1">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-2xl ring-1 ring-white/20">
                              <img src={activeDraggingAlbum.coverUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white truncate italic tracking-tight">{activeDraggingAlbum.title}</h4>
                              <p className="text-[9px] text-[#F4C430]/60 line-clamp-1 italic mb-0.5">
                                {activeDraggingAlbum.description}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {activeDraggingAlbum.isDownloaded && (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-[#F4C430]/80" />
                                )}
                                <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">{activeDraggingAlbum.artist}</p>
                              </div>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-[#F4C430]/10 border border-[#F4C430]/20">
                              <span className="text-[7px] font-bold text-[#F4C430] uppercase tracking-[0.2em] whitespace-nowrap">Relocating</span>
                            </div>
                          </motion.div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
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
                        <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate italic">{album.title}</h4>
                        <p className="text-[9px] text-[#F4C430] truncate uppercase tracking-tighter mt-0.5">{album.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setAlbum(album);
                            setIsDownloadsOpen(false);
                          }}
                          className="p-2 rounded-full bg-[#F4C430]/10 text-[#F4C430] hover:bg-[#F4C430]/20 transition-colors"
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
              className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#F4C430]/10 rounded-full blur-3xl -z-10" />
              
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 border border-[#F4C430]/20 rounded-full animate-ping pointer-events-none" />
                  <Heart className="w-10 h-10 text-[#F4C430] fill-current" />
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
                  className="w-full py-4 bg-[#F4C430] text-black font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#F4C430]/20 text-sm uppercase tracking-widest"
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
    </div>
  );
}
