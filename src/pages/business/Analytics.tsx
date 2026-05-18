import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';

export default function BusinessAnalytics() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Intelligence</h2>
          <p className="text-slate-500 mt-2">Data-driven insights for your venue ambience strategy.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Uptime', value: '99.9%', trend: '+0.1%', positive: true, icon: TrendingUp },
          { label: 'Stream Time', value: '142h', trend: '+12%', positive: true, icon: Clock },
          { label: 'Audience Reach', value: '2.4k', trend: '+4%', positive: true, icon: Users },
          { label: 'Scene Loyalty', value: '88%', trend: '-2%', positive: false, icon: BarChart3 },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-white/5 text-slate-400">
                <stat.icon size={18} />
              </div>
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-bold",
                stat.positive ? "text-emerald-500" : "text-rose-500"
              )}>
                {stat.trend}
                {stat.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              </div>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-none">{stat.label}</p>
            <p className="text-3xl font-bold mt-2 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Chart Placeholder */}
        <div className="p-10 rounded-[40px] bg-white/[0.03] border border-white/5 relative overflow-hidden group">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center gap-2">
            <TrendingUp size={16} /> Operational Continuity
          </h4>
          <div className="h-[300px] flex items-end gap-3 px-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-2 group/bar">
                <div 
                   className="w-full bg-indigo-500/20 group-hover/bar:bg-indigo-500/40 transition-all rounded-t-lg"
                   style={{ height: `${Math.random() * 80 + 20}%` }}
                />
                <span className="text-[8px] font-mono text-slate-700 text-center uppercase">{i}h</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs font-medium text-slate-400 italic">Continuous smooth streaming detected over last 24 hours.</p>
            <p className="text-xs font-bold text-indigo-400">Peak @ 19:00</p>
          </div>
        </div>

        {/* Top Scenes Ranking */}
        <div className="p-10 rounded-[40px] bg-white/[0.03] border border-white/5">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center gap-2">
            <BarChart3 size={16} /> Audience Resonance
          </h4>
          <div className="space-y-6">
            {[
              { label: 'Midnight Lounge', share: 45, color: 'bg-indigo-500' },
              { label: 'Temple Morning', share: 22, color: 'bg-amber-500' },
              { label: 'Fusion Dinner', share: 18, color: 'bg-rose-500' },
              { label: 'Sacred Calm', share: 15, color: 'bg-blue-500' }
            ].map((scene) => (
              <div key={scene.label} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold">{scene.label}</span>
                  <span className="text-[10px] font-mono text-slate-500">{scene.share}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${scene.share}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className={cn("h-full rounded-full shadow-lg", scene.color, "shadow-" + scene.color.split('-')[1] + "-500/20")}
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all">
            Full Insights Report
          </button>
        </div>
      </div>
    </div>
  );
}
