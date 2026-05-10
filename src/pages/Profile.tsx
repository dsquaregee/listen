import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, ShieldCheck, Mail, User, Crown, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
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
          <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">{user.displayName}</h1>
          <div className="flex items-center gap-2 text-slate-400 mt-1">
            <Mail className="w-4 h-4" />
            {user.email}
          </div>
          {user.tier === 'premium' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4C430] text-black text-[10px] font-bold uppercase rounded-full mt-3">
              <Crown className="w-3 h-3 fill-current" />
              Premium Subscriber
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Account Settings</h2>
        
        <SettingsItem icon={Crown} label="Subscription Plan" value={user.tier === 'premium' ? 'Premium Bundle' : 'Free Tier'} highlight={user.tier === 'free'} />
        <SettingsItem icon={ShieldCheck} label="Security & Privacy" value="Connected via Google" />
        <SettingsItem icon={Settings} label="App Preferences" value="Default" />

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 mt-8 bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
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
      "flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 gap-4",
      highlight && "border-primary/20 bg-primary/5"
    )}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
          <Icon className={cn("w-5 h-5", highlight ? "text-primary" : "text-slate-400")} />
        </div>
        <div>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-white font-medium text-sm md:text-base">{value}</p>
        </div>
      </div>
    </div>
  );
}
