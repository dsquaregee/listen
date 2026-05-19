import React, { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  GripVertical,
  X,
  Music2,
  RefreshCw
} from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { usePlayerStore } from '../../store/usePlayerStore';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = Array.from({ length: 12 }, (_, i) => `${(i * 2 + 7) % 24}:00`);

export default function BusinessSchedules() {
  const { currentAlbum } = usePlayerStore();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  useEffect(() => {
    const q = query(collection(db, 'schedules'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedules(data);
    });
    return () => unsubscribe();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newScene, setNewScene] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleAddInterval = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'schedules'), {
        day: 'Mon',
        time: newTime,
        scene: newScene,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewTime('');
      setNewScene('');
    } catch (error) {
      console.error('Error adding interval:', error);
    }
  };

  const handleDeleteInterval = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (error) {
      console.error('Error deleting interval:', error);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schedule Engine</h2>
          <p className="text-slate-500 mt-2">Automate your venue architecture with scheduled ambience scenes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20">
          <Plus size={20} /> Add Interval
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleAddInterval} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Add Interval</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <input 
              required
              placeholder="Time (e.g. 07:00 – 11:00)" 
              value={newTime} 
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all"
            />
            <input 
              required
              placeholder="Scene Name" 
              value={newScene} 
              onChange={(e) => setNewScene(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all"
            />
            <button type="submit" className="w-full bg-indigo-500 text-white font-bold py-3 rounded-xl hover:bg-indigo-400 transition-all">
              Save Interval
            </button>
          </form>
        </div>
      )}

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
              <button 
                onClick={() => setViewMode('timeline')}
                className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", viewMode === 'timeline' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
              >Timeline</button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", viewMode === 'list' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
              >List View</button>
            </div>
          </div>
          
          <div className="px-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Active Atmosphere</h3>
            <div className="p-6 rounded-[32px] bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/20">
                    <Music2 className="text-indigo-400" size={24} />
                 </div>
                 <div>
                    <h4 className="text-lg font-bold">{currentAlbum?.title || 'No Active Scene'}</h4>
                    <p className="text-xs text-indigo-400/70 font-mono tracking-widest uppercase">Live Now</p>
                 </div>
              </div>
              <button className="p-3 rounded-full hover:bg-white/10 transition-all text-slate-400 hover:text-white">
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          <div className="relative min-h-[500px] rounded-[40px] bg-white/[0.02] border border-white/5 p-8 overflow-hidden backdrop-blur-sm">
            {/* Timeline Grids */}
            {viewMode === 'timeline' && (
              <div className="absolute inset-0 flex flex-col pointer-events-none opacity-20">
                {TIMES.map((time) => (
                  <div key={time} className="flex-1 border-b border-white/10 flex items-start px-4">
                    <span className="text-[10px] font-mono text-slate-600 -translate-y-1/2">{time}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Draggable Schedule Entries */}
            <div className={cn("space-y-4 relative z-10 transition-all", selectedItem ? "lg:w-2/3" : "w-full")}>
              {schedules.map((item) => (
                  <motion.div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    whileHover={{ scale: 1.01 }}
                    className={cn("p-6 rounded-3xl backdrop-blur-xl flex items-center justify-between group transition-all shadow-xl", selectedItem?.id === item.id ? "bg-indigo-500/20 border border-indigo-500/50" : "bg-indigo-500/10 border border-indigo-500/30 group-hover:border-indigo-400/40 shadow-indigo-500/5")}
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                        <GripVertical size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-mono text-indigo-400/80 uppercase tracking-widest">{item.time}</p>
                        </div>
                        <h4 className="text-xl font-bold mt-1">{item.scene}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleDeleteInterval(item.id)} className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                        <X size={20} />
                      </button>
                    </div>
                  </motion.div>
              ))}
            </div>

            {selectedItem && (
               <div className="hidden lg:flex fixed right-8 top-1/3 w-1/3 h-1/2 p-6 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl flex-col items-center justify-center gap-4">
                 <h3 className="text-2xl font-bold italic font-serif">Preview: {selectedItem.scene}</h3>
                 <p className="text-slate-500">Scheduled for {selectedItem.time}</p>
                 <button onClick={() => setSelectedItem(null)} className="text-indigo-400 font-bold">Clear Preview</button>
               </div>
            )}

            {/* Empty State / Add Indicator */}
            <button
               onClick={() => setIsModalOpen(true)}
              className="w-full mt-4 py-8 rounded-[32px] border-2 border-dashed border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.01] transition-all flex flex-col items-center justify-center gap-2 group">
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
