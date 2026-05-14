import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Zap, Lock, Sparkles, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Album } from '../types';
import { OptimizedImage } from './OptimizedImage';

export default function PremiumGateway() {
  const [targetAlbum, setTargetAlbum] = useState<Album | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handlePremiumRequired = (e: any) => {
      setTargetAlbum(e.detail);
    };

    window.addEventListener('premium-required', handlePremiumRequired);
    return () => window.removeEventListener('premium-required', handlePremiumRequired);
  }, []);

  if (!targetAlbum) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setTargetAlbum(null)}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-[#0A0807] border border-accent/20 rounded-[40px] overflow-hidden shadow-2xl shadow-accent/10"
        >
          {/* Header Image */}
          <div className="relative h-48 overflow-hidden">
            <OptimizedImage 
              src={targetAlbum.coverUrl} 
              alt={targetAlbum.title} 
              className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/40 to-transparent" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4 border border-accent/30">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-2xl font-serif italic text-white leading-tight">Infinite Access Required</h3>
            </div>

            <button 
              onClick={() => setTargetAlbum(null)}
              className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-10 pt-0 text-center">
            <div className="bg-accent/5 border border-accent/10 rounded-3xl p-6 mb-8 mt-[-20px] relative z-10 backdrop-blur-xl">
              <p className="text-white/60 text-sm font-light italic leading-relaxed mb-4">
                "The frequencies of <span className="text-white font-medium">{targetAlbum.title}</span> belong to the Infinite spectrum."
              </p>
              <div className="flex items-center justify-center gap-4">
                 {[Crown, Zap, Sparkles].map((Icon, i) => (
                   <Icon key={i} className="w-4 h-4 text-accent/40" />
                 ))}
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setTargetAlbum(null);
                  navigate('/premium');
                }}
                className="w-full py-4 bg-accent text-black rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                Become an Infinite Seeker
              </button>
              
              <button
                onClick={() => setTargetAlbum(null)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all"
              >
                Continue Free Journey
              </button>
            </div>

            <p className="mt-8 text-[9px] uppercase tracking-widest text-white/20 font-bold">
              Full Library • Offline Listening
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
