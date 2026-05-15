import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, Music, Crown, ArrowRight, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setUserTier } = usePlayerStore();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        // Wait a small bit to ensure webhook has time to potentially trigger first
        await new Promise(r => setTimeout(r, 1500));
        
        const response = await fetch('/api/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          const data = await response.json();
          setUserTier(data.tier);
          setStatus('success');
          // Auto redirect after celebrating
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 6000);
        } else {
          // If the manual verification fails, it might be because it's already verified by webhook or actual error
          // We can check the local user profile if it's already premium
          if (user?.tier === 'premium') {
             setStatus('success');
          } else {
             setStatus('error');
          }
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
      }
    };

    verify();
  }, [sessionId, setUserTier, user?.tier]);

  return (
    <div className="min-h-screen pt-24 px-6 flex flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 blur-[120px] rounded-full animate-pulse opacity-20" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-md w-full relative z-10 text-center">
        <AnimatePresence mode="wait">
          {status === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-accent animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif italic text-white/80">Synchronizing Resonance...</h2>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Verifying your manifestation session</p>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="flex justify-center">
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.2 }}
                    className="w-24 h-24 bg-accent rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(153,102,204,0.5)] relative z-10"
                  >
                    <CheckCircle2 className="w-12 h-12 text-black" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-accent rounded-full z-0" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl font-serif font-bold italic text-white"
                >
                  Infinite Access Activated
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-white/60 leading-relaxed italic text-sm"
                >
                  The full spectrum is now yours. Your journeys will never end, and your resonance will never fade. Begin your listening experience with high-fidelity immersive sound.
                </motion.p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { icon: Music, label: 'Unfiltered' },
                  { icon: Crown, label: 'Unlocked' },
                  { icon: Sparkles, label: 'Infinite' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + (i * 0.1) }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-white/40">{item.label}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 }}
                className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center gap-4 text-left group cursor-pointer hover:bg-white/[0.05] transition-colors"
                onClick={() => navigate('/album/a1')}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                   <img src="https://images.unsplash.com/photo-1514525253361-9f6fa183c5a6?auto=format&fit=crop&q=80&w=811" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Veena" />
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest font-bold text-accent/60 mb-1 leading-none">Suggested First Journey</p>
                  <h4 className="text-sm font-serif italic text-white leading-tight">Divine Veena Resonance</h4>
                  <p className="text-[10px] text-white/40 mt-1 italic">Begin your premium manifestation.</p>
                </div>
                <div className="ml-auto p-2 rounded-full bg-white/5 group-hover:bg-accent group-hover:text-black transition-all">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 }}
                onClick={() => navigate('/')}
                className="group flex items-center justify-center gap-3 w-full py-5 bg-accent text-black rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all outline-none"
              >
                Enter The Library
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <Shield className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif italic text-white">Resonance Delayed</h2>
                <p className="text-white/40 text-sm italic py-2">
                  We couldn't verify your session instantly. This can happen if Stripe notification is still in transit.
                </p>
                <p className="text-white/60 text-xs italic">
                  Don't worry—your account will activate automatically within minutes. You can check your profile tier shortly.
                </p>
              </div>
              <div className="pt-6 space-y-4">
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-4 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
