import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setIsVisible(true);
      }
    };

    // For iOS, we show the prompt if it's not already installed
    if (isIOSDevice && !isStandalone) {
      setIsVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, we just show instructions (the UI is already there, maybe just scroll to top or alert)
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:bottom-28 md:w-80 z-[300]"
      >
        <div className="relative group">
          {/* Neon Border Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse" />
          
          <div className="relative bg-[#111111]/90 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl flex items-center shadow-2xl overflow-hidden">
            <div className="relative z-10 flex flex-1 items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <Download className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm tracking-tight leading-tight">
                  {isIOS ? 'Install DsquareGee' : 'Install DsquareGee'}
                </h4>
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-[0.1em] mt-0.5">
                  {isIOS ? 'Tap Share and "Add to Home Screen"' : 'Offline Cinematic Audio Experience'}
                </p>
              </div>
              
              {!isIOS && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleInstall}
                    className="bg-primary hover:bg-accent text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap shadow-[0_0_15px_rgba(153,102,204,0.3)]"
                  >
                    Install
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 text-white/20 hover:text-white transition-colors p-1"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Decorative background intensity lines */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
