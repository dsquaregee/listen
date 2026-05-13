import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, ShieldCheck, Mail, User, Crown, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Profile() {
  const { user, setUser } = useAuthStore();

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || 'Listener',
        photoURL: result.user.photoURL || '',
        tier: 'free',
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile, { merge: true });
      setUser(userProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user?.uid || 'new_user'}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (!user) {
    return (
      <div className="pt-32 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-white mb-2">Welcome to DsquareGee</h1>
        <p className="text-slate-400 max-w-sm mb-8">
          Join our curated immersive music universe to save your favorites and access premium features.
        </p>
        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-primary overflow-hidden shadow-2xl">
          <img src={user.photoURL || undefined} alt={user.displayName} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">{user.displayName}</h1>
          <div className="flex items-center gap-2 text-slate-400 mt-1">
            <Mail className="w-4 h-4" />
            {user.email}
          </div>
          {user.tier === 'premium' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-black text-[10px] font-bold uppercase rounded-full mt-3 shadow-lg shadow-primary/20">
              <Crown className="w-3 h-3 fill-current" />
              Premium Subscriber
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {user.tier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[32px] bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 mb-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Crown className="w-24 h-24 text-accent -rotate-12" />
            </div>
            <h3 className="text-xl font-serif font-bold italic text-white mb-2">Elevate to Infinite Seeker</h3>
            <p className="text-xs text-white/60 mb-6 leading-relaxed max-w-[80%]">
              Unlock the full spectrum of sounds, including restricted premium experiences and unlimited atmospshere creation.
            </p>
            <Link 
              to="/premium"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-black font-bold rounded-full text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-accent/20"
            >
              Subscribe
            </Link>
          </motion.div>
        )}

        <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4">Account Settings</h2>
        
        <SettingsItem icon={Crown} label="Subscription Plan" value={user.tier === 'premium' ? `Premium ($${user.subscriptionAmount || 0} / ${user.subscriptionCurrency || 'USD'})` : 'Free Tier'} highlight={user.tier === 'free'} />
        <SettingsItem icon={ShieldCheck} label="Security & Privacy" value="Connected via Google" />
        <SettingsItem icon={Settings} label="App Preferences" value="Default" />

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 mt-8 bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/10 hover:bg-red-500/20 transition-all active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function SettingsItem({ icon: Icon, label, value, highlight }: { icon: any, label: string, value: string, highlight?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 gap-4 transition-all hover:bg-white/[0.04]",
      highlight && "border-primary/20 bg-primary/[0.02]"
    )}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
          <Icon className={cn("w-5 h-5", highlight ? "text-primary" : "text-white/40")} />
        </div>
        <div>
          <p className="text-[10px] md:text-xs text-white/30 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-white font-medium text-sm md:text-base tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}
