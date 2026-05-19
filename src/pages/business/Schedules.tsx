import React, { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  GripVertical,
  X
} from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = Array.from({ length: 12 }, (_, i) => `${(i * 2 + 7) % 24}:00`);

export default function BusinessSchedules() {
  const [schedules, setSchedules] = useState<any[]>([]);

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
  const [newZone, setNewZone] = useState('');

  const handleAddInterval = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'schedules'), {
        day: 'Mon',
        time: newTime,
        scene: newScene,
        zone: newZone,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewTime('');
      setNewScene('');
      setNewZone('');
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
            <input 
              required
              placeholder="Zone" 
              value={newZone} 
              onChange={(e) => setNewZone(e.target.value)}
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
            <div className="space-y-4 relative z-10">
              {schedules.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-xl flex items-center justify-between group-hover:border-indigo-400/40 transition-all shadow-xl shadow-indigo-500/5 group"
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
                      <button onClick={() => handleDeleteInterval(item.id)} className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                        <X size={20} />
                      </button>
                    </div>
                  </motion.div>
              ))}
            </div>

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
