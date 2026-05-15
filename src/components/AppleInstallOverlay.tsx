import React from 'react';
import { motion } from 'motion/react';
import { Share, SquarePlus, X, Compass, Globe, Sparkles } from 'lucide-react';

interface AppleInstallOverlayProps {
  onClose: () => void;
  isInAppBrowser?: boolean;
  isSafari?: boolean;
}

export function AppleInstallOverlay({ onClose, isInAppBrowser = false, isSafari = true }: AppleInstallOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-end md:justify-center p-6 bg-black/95 backdrop-blur-3xl"
    >
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <button 
          onClick={onClose}
          className="absolute -top-16 right-0 p-3 rounded-full bg-white/5 border border-white/10 text-white/30 hover:text-white transition-all hover:scale-110 active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-[#111111]/80 border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
          {/* Top visual */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-black border border-white/10 flex items-center justify-center relative z-10 p-4">
                <img src="/pwa-512x512.png" className="w-full h-full object-contain" alt="DsquareGee Logo" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary rounded-3xl z-0" 
              />
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50" />
            </div>
          </div>

          <div className="text-center space-y-3 mb-10">
            <h2 className="text-3xl font-serif italic text-white leading-tight">
              A Native Sanctuary
            </h2>
            <p className="text-white/40 text-xs px-4 leading-relaxed italic">
              Manifest DsquareGee onto your home screen for the ultimate unfiltered resonance.
            </p>
          </div>

          {!isSafari && !isInAppBrowser ? (
            <div className="space-y-6">
              <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/10 text-center">
                <Compass className="w-8 h-8 text-white/40 mx-auto mb-4" />
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mb-2">Safari Recommended</p>
                <p className="text-white/40 text-[10px] leading-relaxed italic">
                  For the most seamless installation, please open this journey in the native <span className="text-white">Safari</span> browser.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-5 bg-primary text-black rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] font-bold shadow-[0_0_30px_rgba(153,102,204,0.3)] transition-all active:scale-95"
              >
                I Understand
              </button>
            </div>
          ) : isInAppBrowser ? (
            <div className="space-y-6">
              <div className="p-5 rounded-[24px] bg-red-500/10 border border-red-500/20 text-center">
                <Globe className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="text-xs text-red-100 font-bold uppercase tracking-wider mb-2">In-App Browser Detected</p>
                <p className="text-white/60 text-[10px] leading-relaxed italic">
                  For the best immersive experience and installation support, please open this journey in <span className="text-white font-bold">Safari</span>.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-[8px] uppercase tracking-widest font-black text-white/20">How to exit this portal:</p>
                <div className="flex items-center gap-3 text-white/40 italic text-xs">
                  <span>Tap <span className="text-white">...</span> or <Share className="w-3 h-3 inline pb-1" /></span>
                  <span>•</span>
                  <span>Select "Open in Safari"</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start gap-5 group">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Share className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">1. Initiate Connection</p>
                    <p className="text-white/40 text-[10px] italic leading-tight mt-1">Tap the share icon at the bottom of your screen.</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <SquarePlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">2. Add to Home Screen</p>
                    <p className="text-white/40 text-[10px] italic leading-tight mt-1">Scroll down and select "Add to Home Screen" from the manifestation list.</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">3. Finalize Manifestation</p>
                    <p className="text-white/40 text-[10px] italic leading-tight mt-1">Tap "Add" in the top-right corner to complete the portal installation.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-[20px] text-[10px] uppercase font-black tracking-[0.3em] transition-all"
                >
                  I'm Ready
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
