import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Crown, Zap, Shield, Headphones, Smartphone, Sparkles, Globe, Infinity, ArrowLeft, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

import { Toaster, toast } from 'sonner';

export default function Premium() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [view, setView] = useState<'consumer' | 'business'>('consumer');

  const handleSubscribe = async (tier: string = 'premium') => {
    if (!user) return toast.error('Please sign in to subscribe.');

    setIsSubscribing(true);
    const toastId = toast.loading(`Preparing ${tier.replace('_', ' ')} checkout...`);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || 'Listener',
          tier: tier
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
          className="absolute -top-16 left-0 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return
        </button>

        {/* View Switcher */}
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 mb-12 self-center mx-auto w-fit">
          <button 
            onClick={() => setView('consumer')}
            className={cn(
              "px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              view === 'consumer' ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-white/40 hover:text-white"
            )}
          >
            For Individuals
          </button>
          <button 
            onClick={() => setView('business')}
            className={cn(
              "px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              view === 'business' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-white/40 hover:text-white"
            )}
          >
            For Business
          </button>
        </div>

        {view === 'consumer' ? (
          <motion.div
            key="consumer-plan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0A0A0A] border border-accent/20 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group"
          >
            {/* Consumer Plan Content */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/20 transition-colors duration-1000" />
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

              <div className="space-y-10 mb-12">
                {[
                  { icon: Infinity, title: 'Unfiltered Library', desc: 'Every raga, fusion, and journey at your command.' },
                  { icon: Smartphone, title: 'Offline Preservation', desc: 'Download atmospheres for disconnect immunity.' },
                  { icon: Sparkles, title: 'High Fidelity', desc: 'High-bitrate studio master streaming.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-bold">{item.title}</h4>
                      <p className="text-white/40 text-xs mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleSubscribe('premium')}
                disabled={isSubscribing || user?.tier === 'premium'}
                className={cn(
                  "w-full py-6 rounded-[24px] font-black uppercase tracking-[0.4em] text-[10px] transition-all relative overflow-hidden group shadow-2xl",
                  isSubscribing ? "opacity-50 cursor-wait" : "bg-accent text-black hover:bg-white hover:scale-[1.02] active:scale-95 shadow-accent/20"
                )}
              >
                {isSubscribing ? 'Opening Portal...' : user?.tier === 'premium' ? 'Resonance Active' : 'Enter The Infinite'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="business-plans"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Business Basic */}
            <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-[40px] flex flex-col justify-between hover:border-indigo-500/30 transition-all group">
               <div className="space-y-6">
                 <div>
                   <h3 className="text-2xl font-bold text-white italic">Business Basic</h3>
                   <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Foundational Ambience</p>
                 </div>
                 <div className="space-y-4">
                   {[
                     'Commercial Licensing',
                     '1 Registered Device',
                     'Smart Scheduling Engine',
                     'Standard Analytics'
                   ].map(f => (
                     <div key={f} className="flex items-center gap-3 text-white/60 text-xs">
                       <Check size={14} className="text-indigo-400" /> {f}
                     </div>
                   ))}
                 </div>
               </div>
               <button 
                 onClick={() => handleSubscribe('business_basic')}
                 disabled={isSubscribing}
                 className="mt-12 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all"
               >
                 Start Basic
               </button>
            </div>

            {/* Business Pro */}
            <div className="bg-indigo-600/10 border border-indigo-500/30 p-8 rounded-[40px] flex flex-col justify-between relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-20">
                 <Zap className="text-indigo-500" size={32} />
               </div>
               <div className="space-y-6">
                 <div>
                   <h3 className="text-2xl font-bold text-white italic">Business Pro</h3>
                   <p className="text-indigo-400 text-[10px] uppercase tracking-widest mt-1">Commercial OS</p>
                 </div>
                 <div className="space-y-4">
                   {[
                     'Unlimited High-Fidelity',
                     'Up to 5 Devices',
                     'Advanced Zone Control',
                     'Predictive Scheduling',
                     'Venue Pulse Analytics'
                   ].map(f => (
                     <div key={f} className="flex items-center gap-3 text-white/80 text-xs">
                       <Check size={14} className="text-indigo-500" /> {f}
                     </div>
                   ))}
                 </div>
               </div>
               <button 
                 onClick={() => handleSubscribe('business_pro')}
                 disabled={isSubscribing}
                 className="mt-12 w-full py-4 rounded-2xl bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
               >
                 Deploy Pro
               </button>
            </div>
          </motion.div>
        )}

        <p className="text-[8px] text-center text-white/20 mt-12 uppercase tracking-widest font-bold">
          Secure Resonance via Stripe • Cancel Anytime
        </p>
      </div>
    </div>
  );
}
