import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import AudioPlayer from './AudioPlayer';
import { AnimatePresence, motion } from 'motion/react';

export default function GlobalPlayer() {
  const { currentTrack } = usePlayer();

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 md:bottom-0 mb-16 md:mb-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <AudioPlayer 
              key={currentTrack.id}
              url={currentTrack.url}
              title={currentTrack.title}
              isPreview={currentTrack.isPreview}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
