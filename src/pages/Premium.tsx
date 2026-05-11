import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Crown, Zap, Shield, Headphones, Smartphone, Sparkles, Globe, Infinity, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Premium() {
  const { setUserTier } = usePlayerStore();
  const { user, setUser } = useAuthStore();
  const [amount, setAmount] = useState(10);
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
    if (!user) return alert('Please sign in to subscribe.');
    if (amount < 4) return alert('Minimum subscription is $4');

    setIsSubscribing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        tier: 'premium' as const,
        isPremium: true,
        subscriptionAmount: amount,
        subscriptionCurrency: currency,
        subscriptionDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, updateData);
      
      setUser({ ...user, ...updateData });
      setUserTier('premium');
      alert('Welcome to the Universe! Your support is deeply appreciated.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const localPrice = Math.round(amount * (exchangeRates[currency] || 1));

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 relative overflow-hidden bg-black">
      {/* Immersive background elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#9966CC]/5 blur-[150px] rounded-full -z-10" />

      <header className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Subscription Selection</span>
        </motion.div>
        <h1 className="text-5xl sm:text-7xl font-serif font-bold italic text-white mb-6 leading-tight">
          Support the <br />
          <span className="text-primary drop-shadow-[0_0_20px_rgba(153,102,204,0.3)]">Sonic Craft</span>
        </h1>
        <p className="text-white/40 text-lg sm:text-xl font-light italic">
          Pay what you want. $4 monthly minimum. <br />
          Unlock High-Fidelity Universes & Offline Echoes.
        </p>
      </header>

      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-primary/20 p-10 rounded-[40px] shadow-2xl relative overflow-hidden"
        >
          {/* Decorative backdrop */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h3 className="text-2xl font-serif font-bold italic text-white">Universal Seeker</h3>
                <p className="text-white/40 text-xs uppercase tracking-widest mt-1">Monthly Subscription</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold italic text-white">
                  {getCurrencySymbol(currency)}{localPrice}
                </div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">Estimated in {currency}</p>
              </div>
            </div>

            <div className="space-y-8 mb-12">
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">
                  <span>Contribution Level</span>
                  <span className="text-primary">${amount} USD / Month</span>
                </div>
                <input 
                  type="range"
                  min="4"
                  max="100"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[8px] uppercase tracking-widest text-white/20">
                  <span>$4 Min</span>
                  <span>Generous Donor</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Zap, label: 'High Fidelity' },
                  { icon: Shield, label: 'Offline Mode' },
                  { icon: Infinity, label: 'Unlimted' },
                  { icon: Crown, label: 'Exclusive' }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <item.icon className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSubscribe}
              disabled={isSubscribing || (user?.tier === 'premium' && user?.subscriptionAmount === amount)}
              className={cn(
                "w-full py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] transition-all relative overflow-hidden group",
                isSubscribing ? "opacity-50 cursor-wait" : "bg-primary text-black hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_rgba(153,102,204,0.2)]"
              )}
            >
              {isSubscribing ? 'Manifesting...' : user?.tier === 'premium' ? 'Update Contribution' : 'Unlock The Universe'}
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </div>
        </motion.div>

        <div className="mt-12 grid grid-cols-4 gap-4 text-center opacity-20">
            {[Globe, Shield, Headphones, DollarSign].map((Icon, i) => (
              <Icon key={i} className="w-5 h-5 mx-auto" />
            ))}
        </div>
      </div>
    </div>
  );
}
