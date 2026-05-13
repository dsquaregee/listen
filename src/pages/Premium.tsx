import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Crown, Zap, Shield, Headphones, Smartphone, Sparkles, Globe, Infinity, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

import { Toaster, toast } from 'sonner';

export default function Premium() {
  const { setUserTier } = usePlayerStore();
  const { user, setUser } = useAuthStore();
  const [amount, setAmount] = useState(3);
  const [currency, setCurrency] = useState('USD');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Simple currency detection based on locale
  useEffect(() => {
    const locale = navigator.language;
    if (locale.includes('IN')) setCurrency('INR');
    else if (locale.includes('GB')) setCurrency('GBP');
    else if (locale.includes('EU') || locale.includes('FR') || locale.includes('DE')) setCurrency('EUR');
    else setCurrency('USD');
  }, []);

  const exchangeRates: Record<string, number> = {
    'USD': 1,
    'INR': 83,
    'GBP': 0.8,
    'EUR': 0.92
  };

  const getCurrencySymbol = (cur: string) => {
    switch (cur) {
      case 'INR': return '₹';
      case 'GBP': return '£';
      case 'EUR': return '€';
      default: return '$';
    }
  };

  const handleSubscribe = async () => {
    if (!user) return toast.error('Please sign in to subscribe.');
    if (amount < 3) return toast.error('Minimum subscription is $3');

    setIsSubscribing(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid,
          amount: amount * 100 
        }), // Stripe expects amounts in cents
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe Checkout
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(`Failed to start checkout: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure Stripe is configured in the environment.`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const localPrice = Math.round(amount * (exchangeRates[currency] || 1));

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 relative overflow-hidden bg-black flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full mx-auto">
        {/* Infinite Resonance Tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-accent/30 p-10 rounded-[40px] shadow-2xl relative overflow-hidden cinematic-glow"
        >
          {/* Decorative backdrop */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-serif font-bold italic text-white">Infinite Seeker</h3>
                <p className="text-accent/60 text-[10px] uppercase tracking-widest mt-1">The Full Cinematic Spectrum</p>
              </div>
              <div className="p-2 bg-accent/20 rounded-full">
                <Crown className="w-4 h-4 text-accent" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-5xl font-bold italic text-white">{getCurrencySymbol(currency)}{localPrice}</span>
              <span className="text-white/40 text-xs italic">/ monthly</span>
            </div>

            <div className="space-y-8 mb-12 flex-grow">
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">
                  <span>Manifestation Contribution</span>
                  <span className="text-accent">${amount} USD</span>
                </div>
                <input 
                  type="range"
                  min="3"
                  max="100"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-[8px] uppercase tracking-widest text-white/20">
                  <span>$3 Minimum</span>
                  <span>Unlimited Support</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Infinity, label: 'Full Library' },
                  { icon: Smartphone, label: 'Offline Listening' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <item.icon className="w-4 h-4 text-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSubscribe}
              disabled={isSubscribing || user?.tier === 'premium'}
              className={cn(
                "w-full py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] transition-all relative overflow-hidden group",
                isSubscribing ? "opacity-50 cursor-wait" : "bg-accent text-black hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_rgba(197,160,89,0.2)]"
              )}
            >
              {isSubscribing ? 'Manifesting...' : user?.tier === 'premium' ? 'Currently Infinite' : 'Unlock The Universe'}
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
