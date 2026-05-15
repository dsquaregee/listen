import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Track {
  id: string;
  title: string;
  url: string;
  coverUrl: string;
  isPreview?: boolean;
}

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  playNext: () => void;
  setIsPlaying: (playing: boolean) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const playNext = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const clearQueue = () => {
    setQueue([]);
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      queue,
      isPlaying,
      playTrack,
      addToQueue,
      removeFromQueue,
      playNext,
      setIsPlaying,
      clearQueue
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
