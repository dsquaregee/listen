import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, ShieldCheck, Mail, User, Crown, Settings, Database, HardDrive } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { offlineService } from '../services/offlineService';
import { OptimizedImage } from '../components/OptimizedImage';

import { Toaster, toast } from 'sonner';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function Profile() {
  const { user, setUser, isLoading: authLoading } = useAuthStore();
  const [storage, setStorage] = useState<{ used: number; quota: number } | null>(null);

  const handleLogin = async () => {
    const toastId = toast.loading('Signing in with Google...');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Signed in successfully!', { id: toastId });
      // Profile creation and store update is handled by the real-time listener in App.tsx
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Sign-in failed. Please ensure popups are allowed.', { id: toastId });
      handleFirestoreError(error, OperationType.WRITE, 'auth/login');
    }
  };

  useEffect(() => {
    const fetchStorage = async () => {
      const usage = await offlineService.getStorageUsage();
      setStorage(usage);
    };
    fetchStorage();
  }, []);

  const handleManageSubscription = async () => {
    // If we have a customer ID, try to open the portal
    if (user?.stripeCustomerId) {
      return initiatePortal(user.stripeCustomerId);
    }
    
    // If no customer ID, try to sync first (they might have just paid or be an admin)
    const tid = toast.loading('Synchronizing with Stripe...');
    try {
      const res = await fetch('/api/sync-user-stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.uid,
          email: user?.email 
        })
      });
      const data = await res.json();
      
      if (data.success && data.tier === 'premium') {
        const userDocRef = doc(db, 'users', user!.uid);
        try {
          await setDoc(userDocRef, {
            tier: 'premium',
            stripeCustomerId: data.stripeCustomerId,
            subscriptionId: data.subscriptionId,
            subscriptionStatus: data.status,
            updatedAt: new Date()
          }, { merge: true });
          
          toast.success('Premium status restored!', { id: tid });
          setTimeout(() => window.location.reload(), 1000);
          return;
        } catch (ruleErr) {
          console.error('Client-side profile update failed:', ruleErr);
          if (data.backendWriteError) {
            toast.error(`Sync failed on both ends. Server error: ${data.backendWriteError}`, { id: tid });
          } else {
            // Backend succeeded (no error reported) but client failed
            toast.success('Sync complete (Server)! Refreshing...', { id: tid });
            setTimeout(() => window.location.reload(), 2000);
          }
          return;
        }
      }
      
      if (data.success && data.stripeCustomerId) {
        toast.success('Billing record found!', { id: tid });
        return initiatePortal(data.stripeCustomerId);
      }
      
      toast.info('No active subscription found. If you just paid, please wait a few seconds and try again.', { id: tid });
    } catch (e) {
      toast.error('Sync failed. Please contact support.', { id: tid });
    }
  };

  const initiatePortal = async (customerId: string) => {
    const toastId = toast.loading('Connecting to Stripe Billing...');
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId,
          returnUrl: window.location.origin + '/profile'
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Portal redirect failed');
      
      toast.dismiss(toastId);
      window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
      toast.error(error instanceof Error ? error.message : 'Could not open billing portal.', { id: toastId });
    }
  };


  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (authLoading) {
    return (
      <div className="pt-32 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
        <p className="text-white/40 uppercase text-[10px] tracking-widest animate-pulse">Reconnecting Resonance...</p>
      </div>
    );
  }

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
    <div className="pt-24 px-6 max-w-2xl mx-auto pb-32">
      <Toaster position="top-center" richColors />
      <div className="flex items-center gap-6 mb-8">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <OptimizedImage 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
            alt="Profile" 
            className="relative w-24 h-24 rounded-full border-2 border-white/10 shadow-2xl"
          />
          {user.tier === 'premium' && (
            <div className="absolute -bottom-1 -right-1 bg-primary text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-surface shadow-lg">
              Infinite
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">{user.displayName}</h1>
          <div className="flex items-center gap-2 text-white/40 mt-1">
            <Mail className="w-4 h-4" />
            {user.email}
          </div>
        </div>
      </div>

      {/* EMERGENCY SYNC LINK - ALWAYS VISIBLE FOR NON-PREMIUM OR IF THEY NEED IT */}
      <div className="mb-8">
        <button 
          onClick={handleManageSubscription}
          className="w-full py-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center gap-3 group hover:bg-primary/20 transition-all"
        >
          <div className="p-2 bg-primary/20 rounded-lg group-hover:scale-110 transition-transform">
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white uppercase tracking-widest">Restore Subscription</p>
            <p className="text-[10px] text-white/40">Sync your payment resonance if not applied</p>
          </div>
        </button>
      </div>

      <div className="space-y-4">
        {user.tier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[32px] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 mb-8 relative overflow-hidden group shadow-[0_0_40px_rgba(153,102,204,0.1)]"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Crown className="w-24 h-24 text-primary -rotate-12" />
            </div>
            <h3 className="text-xl font-serif font-bold italic text-white mb-2">Elevate to Infinite Seeker</h3>
            <p className="text-xs text-white/60 mb-6 leading-relaxed max-w-[80%]">
              Unlock the full spectrum of sounds, including restricted premium experiences and unlimited atmospshere creation.
            </p>
            <Link 
              to="/premium"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-black font-bold rounded-full text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
              Subscribe
            </Link>
            
            <button 
              onClick={handleManageSubscription}
              className="mt-4 block text-[8px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-colors"
            >
              Already paid? Sync Subscription
            </button>
          </motion.div>
        )}

        <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4">Account Settings</h2>
        
        <div onClick={handleManageSubscription} className="cursor-pointer">
          <SettingsItem 
            icon={Crown} 
            label="Subscription Plan" 
            value={user.tier === 'premium' ? "Infinite Seeker (Active)" : "Free Listener"} 
            highlight={user.tier === 'free'} 
            badge="Manage / Sync"
          />
        </div>


        <SettingsItem icon={ShieldCheck} label="Security & Privacy" value="Connected via Google" />
        <SettingsItem icon={Settings} label="App Preferences" value="Default" />

        <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4">Preservation & Storage</h2>
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5">
                <HardDrive className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Local Resonance Storage</p>
                <p className="text-white font-medium text-sm">{storage ? formatBytes(storage.used) : 'Calculating...'} used</p>
              </div>
            </div>
            {storage?.quota && (
               <div className="text-right">
                <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Quota Allocation</p>
                <p className="text-white/60 font-mono text-[10px]">{Math.round((storage.used / storage.quota) * 100)}%</p>
              </div>
            )}
          </div>
          
          <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: storage && storage.quota ? `${(storage.used / storage.quota) * 100}%` : storage ? '10%' : 0 }}
              className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_10px_rgba(153,102,204,0.4)]"
            />
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <p className="text-[8px] text-white/20 italic max-w-[200px]">
              Offline preservation uses your browser's persistent storage. Clearing cache will remove saved albums.
            </p>
            <button 
              onClick={async () => {
                if (window.confirm('Clear all offline preserved content?')) {
                   await offlineService.clearAll();
                   const usage = await offlineService.getStorageUsage();
                   setStorage(usage);
                   toast.success('Offline storage cleared.');
                }
              }}
              className="text-[9px] text-red-400/60 uppercase font-black tracking-widest hover:text-red-400 transition-colors"
            >
              Clear Storage
            </button>
          </div>
        </div>

        <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4">Billing & Access</h2>
        
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
          <button 
            onClick={handleManageSubscription}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Sync Subscription</p>
                <p className="text-[10px] text-white/40">Restore access if payment was successful</p>
              </div>
            </div>
            <Crown className="w-3 h-3 text-primary animate-pulse" />
          </button>

          <a 
            href="https://billing.stripe.com/p/login/7sYdRb4Er3nG8nSc7T3Ru00" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                <Settings className="w-4 h-4 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Direct Billing Portal</p>
                <p className="text-[10px] text-white/40">Secure access via Stripe Login</p>
              </div>
            </div>
            <Crown className="w-3 h-3 text-white/20 group-hover:text-accent transition-colors" />
          </a>
        </div>

        <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4">Legal</h2>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-2">Policies</p>
          <div className="flex gap-4 text-xs font-medium">
            <Link to="/terms" className="text-primary hover:underline transition-all">Terms of Service</Link>
            <Link to="/privacy" className="text-primary hover:underline transition-all">Privacy Policy</Link>
            <Link to="/refund" className="text-primary hover:underline transition-all">Refund Policy</Link>
          </div>
        </div>

        <p className="text-[10px] text-center text-white/20 mt-8 px-8 leading-relaxed">
          Subscription manifests are managed by Stripe. You can cancel at any time via the billing portal. 
          For refund manifestations, please contact support within 14 days of the transaction.
        </p>

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

function SettingsItem({ icon: Icon, label, value, highlight, badge }: { icon: any, label: string, value: string, highlight?: boolean, badge?: string }) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 gap-4 transition-all hover:bg-white/[0.04]",
      highlight && "border-primary/20 bg-primary/[0.02]",
      badge && "cursor-pointer"
    )}>
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
          <Icon className={cn("w-5 h-5", highlight ? "text-primary" : "text-white/40")} />
        </div>
        <div>
          <p className="text-[10px] md:text-xs text-white/30 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-white font-medium text-sm md:text-base tracking-tight">{value}</p>
        </div>
      </div>
      {badge && (
        <span className="self-start sm:self-center px-2 py-1 bg-white/10 text-white/60 text-[10px] font-bold uppercase rounded border border-white/5">
          {badge}
        </span>
      )}
    </div>
  );
}
