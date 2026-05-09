import { motion } from 'motion/react';
import { Check, Crown, Zap, Shield, Headphones, Smartphone, Sparkles, Globe, Infinity } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePlayerStore } from '../store/usePlayerStore';

export default function Premium() {
  const { setUserTier } = usePlayerStore();

  const tiers = [
    {
      name: 'Free Listener',
      price: '$0',
      desc: 'Begin your journey through the surface of sound.',
      features: ['Standard Bitrate Streaming', 'Limited Mood Collections', 'Community Access'],
      button: 'Current Plan',
      active: true,
      premium: false
    },
    {
      name: 'Universal Seeker',
      price: '$9.99',
      desc: 'Complete immersion into all existing and future universes.',
      features: [
        'Adaptive HLS High Fidelity', 
        'Encrypted Offline Journeys', 
        'Background Mastery Playback', 
        'Exclusive Premium Releases'
      ],
      button: 'Unlock All Universes',
      active: false,
      premium: true
    }
  ];

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 relative overflow-hidden bg-black">
      {/* Immersive background elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#F4C430]/5 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-900/5 blur-[150px] rounded-full -z-10" />

      <header className="text-center max-w-3xl mx-auto mb-20">
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6"
        >
          <Sparkles className="w-3 h-3 text-[#F4C430]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Subscription Selection</span>
        </motion.div>
        <h1 className="text-5xl sm:text-7xl font-serif font-bold italic text-white mb-6 leading-tight">
          Choose Your <br />
          <span className="text-[#F4C430] drop-shadow-[0_0_20px_rgba(244,196,48,0.3)]">Level of Echo</span>
        </h1>
        <p className="text-white/40 text-lg sm:text-xl font-light italic leading-relaxed">
          From the surface ripples to the deep oceanic stillness. <br />
          Support the craft of cinematic Carnatic fusion.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-stretch">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className={cn(
              "relative p-10 rounded-[40px] flex flex-col border transition-all duration-500",
              tier.premium 
                ? "bg-white/5 border-[#F4C430]/20 shadow-[0_30px_100px_rgba(244,196,48,0.05)] ring-1 ring-[#F4C430]/10" 
                : "bg-transparent border-white/5 hover:bg-white/5"
            )}
          >
            {tier.premium && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F4C430] text-black px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                <Crown className="w-3 h-3" /> Most Immersive
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-2xl font-serif font-bold italic text-white mb-2">{tier.name}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{tier.desc}</p>
            </div>

            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-5xl font-bold italic text-white">{tier.price}</span>
              <span className="text-white/30 text-sm font-medium">/ month</span>
            </div>

            <ul className="space-y-6 mb-12 flex-1">
              {tier.features.map(feature => (
                <li key={feature} className="flex items-center gap-4 text-white/60 text-sm">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                    tier.premium ? "bg-[#F4C430]/10" : "bg-white/5"
                  )}>
                    <Check className={cn("w-3 h-3", tier.premium ? "text-[#F4C430]" : "text-white/40")} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button 
              onClick={() => tier.premium && setUserTier('premium')}
              className={cn(
                "w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs transition-all",
                tier.premium 
                  ? "bg-[#F4C430] text-black hover:scale-[1.02] active:scale-95 shadow-xl shadow-[#F4C430]/20" 
                  : "bg-white/5 text-white/40 border border-white/10 cursor-default"
              )}
            >
              {tier.button}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-24 text-center">
        <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale transition-all hover:grayscale-0 hover:opacity-60">
          {[
            { icon: Infinity, label: 'Lifetime' },
            { icon: Globe, label: 'Global CDN' },
            { icon: Shield, label: 'Secure' },
            { icon: Headphones, label: 'Hi-Fi' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-12 text-[10px] text-white/20 uppercase tracking-[0.3em]">
          Secured by Stripe • AES-256 Offline Encryption • HLS L-ABR Enabled
        </p>
      </div>
    </div>
  );
}
