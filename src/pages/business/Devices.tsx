import React from 'react';
import { 
  Smartphone, 
  Monitor, 
  Settings, 
  Power, 
  Trash2, 
  ShieldCheck,
  Zap,
  RefreshCw,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export default function BusinessDevices() {
  const devices = [
    { id: '1', name: 'Main Lobby iPad', type: 'Tablet', status: 'Online', lastActive: 'Active Now', battery: '98%', version: 'v2.4.1' },
    { id: '2', name: 'Private Lounge TV', type: 'Kiosk', status: 'Online', lastActive: 'Active Now', battery: '100%', version: 'v2.4.1' },
    { id: '3', name: 'Terrace Speaker Hub', type: 'Android Box', status: 'Offline', lastActive: '2 hours ago', battery: 'N/A', version: 'v2.3.9' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Device Fleet</h2>
          <p className="text-slate-500 mt-2">Manage your authorized venue playback hardware.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
          <Plus size={18} /> Add Device
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fleet Summary */}
        <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/5 flex flex-col justify-between">
           <div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Licenses</span>
             <p className="text-4xl font-bold mt-2">2 <span className="text-slate-600 text-lg">/ 5</span></p>
           </div>
           <div className="mt-8 flex items-center gap-2 text-xs text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 self-start px-3 py-1 rounded-full border border-emerald-500/20">
             <ShieldCheck size={14} /> Stable Deployment
           </div>
        </div>
        <div className="p-8 rounded-[40px] bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-between">
           <div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Total Stream Time</span>
             <p className="text-4xl font-bold mt-2">1,240 <span className="text-indigo-400/50 text-lg">Hrs</span></p>
           </div>
           <div className="mt-8 text-xs text-indigo-400 font-bold uppercase tracking-widest">Across all devices</div>
        </div>
        <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/5 flex items-center justify-center border-dashed group cursor-pointer hover:border-white/10 transition-all">
           <div className="text-center space-y-3">
             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500 group-hover:text-white transition-all">
               <Zap size={24} />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300">New Deployment</p>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-4">Authorized Fleet</h3>
        <div className="space-y-1">
          {devices.map((device) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center border",
                  device.status === 'Online' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-white/5 border-white/10 text-slate-600"
                )}>
                  {device.type === 'Tablet' ? <Smartphone size={28} /> : <Monitor size={28} />}
                </div>
                <div>
                  <h4 className="text-xl font-bold">{device.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                      device.status === 'Online' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                    )}>
                      {device.status}
                    </span>
                    <span className="text-slate-700">|</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Last Sync: {device.lastActive}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="hidden md:block text-right">
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Version</p>
                  <p className="text-sm font-semibold">{device.version}</p>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Power</p>
                  <p className="text-sm font-semibold">{device.battery}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-3 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all">
                    <RefreshCw size={18} />
                  </button>
                  <button className="p-3 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all">
                    <Settings size={18} />
                  </button>
                  <button className="p-3 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
