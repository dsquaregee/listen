import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  BarChart3, Users, Clock, Activity, 
  TrendingUp, Wallet, ShieldCheck, ChevronRight,
  Layers, Music
} from 'lucide-react';
import CategoryManager from '../components/CategoryManager';
import AlbumManager from '../components/AlbumManager';

export default function AdminDashboard() {
  const { user, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'metrics' | 'content'>('metrics');
  const [activeContent, setActiveContent] = useState<'categories' | 'albums'>('categories');

  if (isLoading) return null;
  if (!user?.isAdmin) return <Navigate to="/" replace />;

  const stats = [
    { label: 'Active Seekers', value: '412', icon: Users, diff: '+12%', color: 'text-blue-400' },
    { label: 'Streaming Time', value: '48.2k hrs', icon: Clock, diff: '+5%', color: 'text-green-400' },
    { label: 'CDN Bandwidth', value: '1.2 TB', icon: Activity, diff: '-2%', color: 'text-[#F4C430]' },
    { label: 'Retention Rate', value: '84%', icon: TrendingUp, diff: '+2.4%', color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 pb-12 bg-black text-white">
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold italic mb-2">Universe Control</h1>
          <p className="text-white/40 uppercase tracking-[0.3em] text-[10px]">Platform health & content orchestrator</p>
        </div>
        
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('metrics')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'metrics' ? 'bg-[#F4C430] text-black shadow-lg shadow-[#F4C430]/20' : 'text-white/40 hover:text-white'}`}
          >
            <Activity className="w-3 h-3" /> Metrics
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-[#F4C430] text-black shadow-lg shadow-[#F4C430]/20' : 'text-white/40 hover:text-white'}`}
          >
            <Layers className="w-3 h-3" /> Content
          </button>
        </div>
      </header>

      {activeTab === 'metrics' ? (
        <>
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
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-4">
            <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-2">
              <p className="text-[10px] uppercase font-bold text-white/40 tracking-[0.2em] mb-4">Orchestrator</p>
              {[
                { id: 'categories', label: 'Categories', icon: Layers, count: 'Manage Collections' },
                { id: 'albums', label: 'Universe Albums', icon: Music, count: 'Manage Experiences' },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveContent(item.id as any)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeContent === item.id ? 'bg-[#F4C430]/10 border-[#F4C430]/30' : 'bg-white/5 border border-white/10 hover:bg-white/10 group'}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${activeContent === item.id ? 'text-[#F4C430]' : 'text-white/40 group-hover:text-white'}`} />
                    <span className={`text-xs font-bold ${activeContent === item.id ? 'text-[#F4C430]' : ''}`}>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3 h-3 ${activeContent === item.id ? 'text-[#F4C430]' : 'text-white/20'}`} />
                </button>
              ))}
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="p-4 md:p-8 rounded-[32px] md:rounded-[40px] bg-white/10 border border-white/10 backdrop-blur-md overflow-x-auto">
              {activeContent === 'categories' ? <CategoryManager /> : <AlbumManager />}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
