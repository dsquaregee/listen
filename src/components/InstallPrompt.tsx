import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppleInstallOverlay } from './AppleInstallOverlay';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showAppleOverlay, setShowAppleOverlay] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isSafari, setIsSafari] = useState(true);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Detect Safari (true Safari, not Chrome on iOS or in-app)
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);
    setIsSafari(isSafariBrowser);

    // Detect In-App Browser (Instagram, FB, TikTok, etc)
    const isInsideApp = /instagram|fbav|fb_iab|messenger|fban|tiktok/.test(userAgent);
    setIsInAppBrowser(isInsideApp);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone && !isIOSDevice) {
        setIsVisible(true);
      }
    };

    // For iOS, we show the prompt if it's not already installed and not in-app browser
    // Or we show it even if in-app browser to warn them to open in Safari
    if (isIOSDevice && !isStandalone) {
      // Delay slightly to not annoy immediately
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowAppleOverlay(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && !showAppleOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:bottom-28 md:w-80 z-[300]"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse" />
              
              <div className="relative bg-[#111111]/90 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl flex items-center shadow-2xl overflow-hidden">
                <div className="relative z-10 flex flex-1 items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm tracking-tight leading-tight">
                      Install DsquareGee
                    </h4>
                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-[0.1em] mt-0.5">
                      {isIOS ? 'Manifest as Native App' : 'Offline Immersive Audio'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleInstallClick}
                      className="bg-primary hover:bg-accent text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap shadow-[0_0_15px_rgba(153,102,204,0.3)]"
                    >
                      {isIOS ? 'Guided Setup' : 'Install'}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setIsVisible(false)}
                  className="absolute top-2 right-2 text-white/20 hover:text-white transition-colors p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAppleOverlay && (
          <AppleInstallOverlay 
            onClose={() => setShowAppleOverlay(false)} 
            isInAppBrowser={isInAppBrowser}
            isSafari={isSafari}
          />
        )}
      </AnimatePresence>
    </>
  );
}
