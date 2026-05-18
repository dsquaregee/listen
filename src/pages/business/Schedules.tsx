import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { cn } from '../../lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = Array.from({ length: 12 }, (_, i) => `${(i * 2 + 7) % 24}:00`);

export default function BusinessSchedules() {
  const [schedules, setSchedules] = useState([
    { id: '1', day: 'Mon', time: '07:00 – 11:00', scene: 'Temple Morning', zone: 'Main Zone' },
    { id: '2', day: 'Mon', time: '11:00 – 16:00', scene: 'Fusion Dinner', zone: 'Main Zone' },
    { id: '3', day: 'Wed', time: '18:00 – 22:00', scene: 'Midnight Lounge', zone: 'Terrace' },
  ]);

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schedule Engine</h2>
          <p className="text-slate-500 mt-2">Automate your venue architecture with scheduled ambience scenes.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20">
          <Plus size={20} /> Add Interval
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Day Selector */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-4">Weekly Cycle</h3>
          <div className="space-y-1">
            {DAYS.map((day) => (
              <button
                key={day}
                className={cn(
                  "w-full px-6 py-4 rounded-2xl text-left transition-all flex items-center justify-between group",
                  day === 'Mon' ? "bg-white/10 text-white border border-white/10" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                )}
              >
                <span className="font-semibold">{day}</span>
                {day === 'Mon' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Timeline UI */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white"><ChevronLeft size={16} /></button>
              <span className="text-sm font-semibold tracking-wide">Monday, May 18</span>
              <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white"><ChevronRight size={16} /></button>
            </div>
            <div className="bg-white/5 p-1 rounded-xl flex items-center gap-1">
              <button className="px-4 py-1.5 rounded-lg bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">Timeline</button>
              <button className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300">List View</button>
            </div>
          </div>

          <div className="relative min-h-[500px] rounded-[40px] bg-white/[0.02] border border-white/5 p-8 overflow-hidden backdrop-blur-sm">
            {/* Timeline Grids */}
            <div className="absolute inset-0 flex flex-col pointer-events-none opacity-20">
              {TIMES.map((time) => (
                <div key={time} className="flex-1 border-b border-white/10 flex items-start px-4">
                  <span className="text-[10px] font-mono text-slate-600 -translate-y-1/2">{time}</span>
                </div>
              ))}
            </div>

            {/* Draggable Schedule Entries */}
            <Reorder.Group axis="y" values={schedules} onReorder={setSchedules} className="space-y-4 relative z-10">
              {schedules.map((item) => (
                <Reorder.Item 
                  key={item.id} 
                  value={item}
                  className="group cursor-grab active:cursor-grabbing"
                >
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-xl flex items-center justify-between group-hover:border-indigo-400/40 transition-all shadow-xl shadow-indigo-500/5"
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                        <GripVertical size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-mono text-indigo-400/80 uppercase tracking-widest">{item.time}</p>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.zone}</p>
                        </div>
                        <h4 className="text-xl font-bold mt-1">{item.scene}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border border-black bg-slate-800 flex items-center justify-center text-[10px] overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}${i}`} alt="user" />
                          </div>
                        ))}
                      </div>
                      <button className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {/* Empty State / Add Indicator */}
            <button className="w-full mt-4 py-8 rounded-[32px] border-2 border-dashed border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.01] transition-all flex flex-col items-center justify-center gap-2 group">
              <div className="p-3 rounded-full bg-white/5 text-slate-600 group-hover:text-indigo-400 transition-colors">
                <Plus size={24} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Drag to schedule scene</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
