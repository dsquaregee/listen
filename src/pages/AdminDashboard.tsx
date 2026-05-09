import React from 'react';
import { motion } from 'motion/react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  BarChart3, Users, Clock, Activity, 
  TrendingUp, Wallet, ShieldCheck, ChevronRight 
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!user?.isAdmin) return <Navigate to="/" replace />;

  const stats = [
    { label: 'Active Seekers', value: '412', icon: Users, diff: '+12%', color: 'text-blue-400' },
    { label: 'Streaming Time', value: '48.2k hrs', icon: Clock, diff: '+5%', color: 'text-green-400' },
    { label: 'CDN Bandwidth', value: '1.2 TB', icon: Activity, diff: '-2%', color: 'text-[#F4C430]' },
    { label: 'Retention Rate', value: '84%', icon: TrendingUp, diff: '+2.4%', color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen pt-24 px-8 pb-12 bg-black text-white">
      <header className="mb-12">
        <h1 className="text-4xl font-serif font-bold italic mb-2">Universe Control</h1>
        <p className="text-white/40 uppercase tracking-[0.3em] text-xs">Platform health & scaling metrics</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-white/5">
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className={cn("text-[10px] font-bold", stat.diff.startsWith('+') ? 'text-green-400' : 'text-red-400')}>
                {stat.diff}
              </span>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold italic">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Placeholder */}
        <div className="lg:col-span-2 p-8 rounded-[40px] bg-white/5 border border-white/10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-serif font-bold italic text-xl">Streaming Efficiency</h3>
            <div className="flex gap-4">
              {['HLS HD', 'HLS SD', 'Segmented'].map(tab => (
                <button key={tab} className="text-[10px] uppercase font-bold text-white/40 hover:text-white transition-colors">{tab}</button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {[...Array(24)].map((_, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.random() * 80 + 20}%` }}
                className="flex-1 bg-[#F4C430]/20 rounded-full hover:bg-[#F4C430]/50 transition-colors cursor-pointer"
              />
            ))}
          </div>
        </div>

        {/* Security & Access */}
        <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 space-y-6">
          <h3 className="font-serif font-bold italic text-xl">Access Health</h3>
          <div className="space-y-4">
            {[
              { label: 'Stripe Events', status: 'Healthy', icon: Wallet },
              { label: 'Signed URLs', status: 'Active', icon: ShieldCheck },
              { label: 'Cloud CDN', status: 'Caching', icon: Activity },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5"><item.icon className="w-4 h-4 text-white/40" /></div>
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#F4C430]">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
