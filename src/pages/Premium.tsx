import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Crown, Zap, Shield, Headphones, Smartphone, Sparkles, Globe, Infinity, ArrowLeft, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

import { Toaster, toast } from 'sonner';

export default function Premium() {
  const { setUserTier } = usePlayerStore();
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return toast.error('Please sign in to subscribe.');

    setIsSubscribing(true);
    const toastId = toast.loading('Preparing checkout...');
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid
        }), 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      toast.dismiss(toastId);
      window.location.href = url; // Redirect to Stripe Checkout
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(`Subscription failed: ${error instanceof Error ? error.message : 'Unknown error'}.`, { id: toastId });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 relative overflow-hidden bg-black flex flex-col items-center">
      <div className="max-w-2xl w-full mx-auto relative">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute -top-12 left-0 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return
        </button>

        {/* Infinite Resonance Tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A0A0A] border border-accent/20 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group"
        >
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/20 transition-colors duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-serif font-bold italic text-white tracking-tight">Infinite Seeker</h3>
                <p className="text-accent/60 text-[10px] uppercase tracking-[0.3em] font-black mt-2">Maximum Resonance Spectrum</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20 shadow-[0_0_20px_rgba(153,102,204,0.2)]">
                <Crown className="w-6 h-6 text-accent animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-12">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-serif font-bold italic text-white">Infinite Seeker</span>
                <span className="text-white/40 text-sm uppercase tracking-widest font-bold">/ Subscription</span>
              </div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest font-black italic">Access the unfiltered universe</p>
            </div>

            <div className="space-y-10 mb-12 flex-grow">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Infinity className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold">Unfiltered Library</h4>
                    <p className="text-white/40 text-xs mt-1 leading-relaxed">No limits. Every raga, every fusion, every journey is yours to explore.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold">Offline Preservation</h4>
                    <p className="text-white/40 text-xs mt-1 leading-relaxed">Download journeys to your device for immersive listening without connection.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold">Resonance Enhancement</h4>
                    <p className="text-white/40 text-xs mt-1 leading-relaxed">Exclusive access to high-fidelity audio streams and beta atmospheric features.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 p-5 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                 <HelpCircle className="w-4 h-4 text-white" />
               </div>
              <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
                Promo Code Manifestation
              </p>
              <p className="text-[10px] text-white/30 italic leading-relaxed">
                If you possess a sacred code, apply it on the next secure page. Once applied, the total will recalibrate. 
                <span className="block mt-2 text-white/50">Note: Promotional codes are customer-facing strings created in Stripe.</span>
              </p>
            </div>

            <button 
              onClick={handleSubscribe}
              disabled={isSubscribing || user?.tier === 'premium'}
              className={cn(
                "w-full py-6 rounded-[24px] font-black uppercase tracking-[0.4em] text-[10px] transition-all relative overflow-hidden group shadow-2xl",
                isSubscribing ? "opacity-50 cursor-wait" : "bg-accent text-black hover:bg-white hover:scale-[1.02] active:scale-95 shadow-accent/20"
              )}
            >
              <span className="relative z-10">
                {isSubscribing ? 'Opening Portal...' : user?.tier === 'premium' ? 'Resonance Active' : 'Enter The Infinite'}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            </button>

            <p className="text-[8px] text-center text-white/20 mt-6 uppercase tracking-widest font-bold">
              Secure Resonance via Stripe • Cancel Anytime
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
