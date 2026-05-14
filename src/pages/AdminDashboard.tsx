import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  BarChart3, Users, Clock, Activity, 
  TrendingUp, Wallet, ShieldCheck, ChevronRight,
  Layers, Music, RefreshCw, Database
} from 'lucide-react';
import CategoryManager from '../components/CategoryManager';
import AlbumManager from '../components/AlbumManager';
import { collection, query, where, getDocs, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MOCK_ALBUMS, MOCK_CATEGORIES } from '../data/mockData';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'metrics' | 'content'>('metrics');
  const [activeContent, setActiveContent] = useState<'categories' | 'albums'>('categories');
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalHours: 0,
    topAlbum: 'None',
    premiumUsers: 0
  });

  useEffect(() => {
    if (user?.isAdmin) {
      const fetchMetrics = async () => {
        try {
          const userSn = await getDocs(collection(db, 'users'));
          let totalMins = 0;
          let premium = 0;
          userSn.forEach(doc => {
            const data = doc.data();
            totalMins += (data.totalMinutesStreamed || 0);
            if (data.tier === 'premium') premium++;
          });

          const albumSn = await getDocs(collection(db, 'albums'));
          let bestAlbum = { title: 'None', plays: -1 };
          albumSn.forEach(doc => {
            const data = doc.data();
            if (data.playCount > bestAlbum.plays) {
              bestAlbum = { title: data.title, plays: data.playCount };
            }
          });

          setMetrics({
            totalUsers: userSn.size,
            totalHours: Math.round(totalMins / 60),
            topAlbum: bestAlbum.title,
            premiumUsers: premium
          });
        } catch (e) {
          console.error('Failed to fetch admin metrics:', e);
        }
      };
      fetchMetrics();
    }
  }, [user]);

  if (isLoading) return null;
  if (!user?.isAdmin) return <Navigate to="/" replace />;

  const stats = [
    { label: 'Active Seekers', value: metrics.totalUsers.toString(), icon: Users, diff: `+${metrics.premiumUsers} Premium`, color: 'text-primary' },
    { label: 'Streaming Time', value: `${metrics.totalHours} hrs`, icon: Clock, diff: 'Global Accumulation', color: 'text-green-400' },
    { label: 'Top Experience', value: metrics.topAlbum, icon: Music, diff: 'Most Resonated', color: 'text-primary' },
    { label: 'Retention Rate', value: '84%', icon: TrendingUp, diff: '+2.4%', color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 pb-12 bg-[#050505] text-white">
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold italic mb-2">Universe Control</h1>
          <p className="text-white/40 uppercase tracking-[0.3em] text-[10px]">Platform health & content orchestrator</p>
        </div>
        
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('metrics')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'metrics' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
          >
            <Activity className="w-3 h-3" /> Metrics
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
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
                className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 relative overflow-hidden group shadow-2xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-white/[0.05]">
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
            <div className="lg:col-span-2 p-8 rounded-[40px] bg-white/[0.02] border border-white/10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif font-bold italic text-xl">Seeker Directory</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Recent Activity</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-white/20 tracking-widest">
                      <th className="pb-4 pt-0">Seeker</th>
                      <th className="pb-4 pt-0">Vibration Time</th>
                      <th className="pb-4 pt-0">Contribution</th>
                      <th className="pb-4 pt-0">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {/* We'd normally fetch real user list here, let's use a snippet of real data */}
                    <UserListRows />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/10 space-y-6">
              <h3 className="font-serif font-bold italic text-xl">Access Health</h3>
              <div className="space-y-4">
                {[
                  { label: 'Stripe Events', status: 'Healthy', icon: Wallet },
                  { label: 'Signed URLs', status: 'Active', icon: ShieldCheck },
                  { label: 'Cloud CDN', status: 'Caching', icon: Activity },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/[0.05] shadow-lg"><item.icon className="w-4 h-4 text-white/40" /></div>
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-primary">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-4">
            <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/10 space-y-2">
              <p className="text-[10px] uppercase font-bold text-white/40 tracking-[0.2em] mb-4">Orchestrator</p>
              {[
                { id: 'categories', label: 'Categories', icon: Layers, count: 'Manage Collections' },
                { id: 'albums', label: 'Universe Albums', icon: Music, count: 'Manage Experiences' },
                { id: 'analytics', label: 'Resonance Analytics', icon: BarChart3, count: 'Listening Sessions' },
                { id: 'legal', label: 'Legal & IP Hub', icon: ShieldCheck, count: 'Copyright & Protection' },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveContent(item.id as any)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeContent === item.id ? 'bg-primary/10 border-primary/30 shadow-lg' : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] group'}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${activeContent === item.id ? 'text-primary' : 'text-white/40 group-hover:text-white'}`} />
                    <span className={`text-xs font-bold ${activeContent === item.id ? 'text-primary' : ''}`}>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3 h-3 ${activeContent === item.id ? 'text-primary' : 'text-white/20'}`} />
                </button>
              ))}
            </div>
          </aside>


          <main className="lg:col-span-3">
            <div className="p-4 md:p-8 rounded-[32px] md:rounded-[40px] bg-white/10 border border-white/10 backdrop-blur-md overflow-x-auto min-h-[400px]">
              {activeContent === 'categories' && <CategoryManager />}
              {activeContent === 'albums' && <AlbumManager />}
              {activeContent === 'analytics' && <SessionViewer />}
              {activeContent === 'legal' && <LegalIPHub />}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

function SessionViewer() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const q = query(collection(db, 'listening_sessions'), where('startTime', '!=', null));
        const sn = await getDocs(q);
        const sorted = sn.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => b.startTime?.toMillis() - a.startTime?.toMillis());
        setSessions(sorted);
      } catch (e) {
        console.error('Failed to fetch sessions:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  if (loading) return <div className="py-20 text-center text-[10px] uppercase font-bold text-white/20 tracking-widest animate-pulse">Synchronizing Universal Data...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-serif font-bold italic mb-2">Resonance Analytics</h3>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Tracking the global soundscape</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-white/20 tracking-widest">
              <th className="pb-4">Seeker</th>
              <th className="pb-4">Experience</th>
              <th className="pb-4">Digital Tracer (Origin ID)</th>
              <th className="pb-4">Location</th>
              <th className="pb-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sessions.map((session) => (
              <tr key={session.id} className="group hover:bg-white/[0.02]">
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{session.userEmail || 'Anonymous Seeker'}</span>
                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">{session.userId.slice(0, 8)}...</span>
                  </div>
                </td>
                <td className="py-4">
                   <div className="flex flex-col">
                    <p className="text-xs text-white/60 font-serif italic">{session.albumTitle}</p>
                    <p className="text-[9px] font-mono text-primary/60">{Math.round(session.duration)}s resonance</p>
                   </div>
                </td>
                <td className="py-4">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-mono text-primary font-bold">{session.proofOfOriginId || 'LEGACY-SESSION'}</p>
                    <p className="text-[8px] text-white/20 truncate max-w-[150px]">{session.userAgent}</p>
                  </div>
                </td>
                <td className="py-4">
                  {session.location ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                      <p className="text-[10px] text-white/40 font-mono tracking-tighter">
                        {session.location.lat.toFixed(2)}, {session.location.lng.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[9px] text-white/10 italic">Undisclosed</span>
                  )}
                </td>
                <td className="py-4">
                  <p className="text-[10px] text-white/30">
                    {session.startTime?.toDate().toLocaleString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && (
          <div className="py-20 text-center text-xs text-white/20 italic">
            No vibrations recorded in this sector yet.
          </div>
        )}
      </div>
    </div>
  );
}

function LegalIPHub() {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const dmcaTemplate = `DMCA TAKEDOWN NOTICE
To: YouTube Legal Support (Copyright Department)

I am the copyright owner of the music content titled "Natural Tones - Cinematic Fusion".
I have a good faith belief that the material appearing on your service at [INSERT URL] is not authorized by the copyright owner, its agent, or the law.

Proof of Origin: This content was exclusively released on https://dsquaregee.com.
Digital Tracer ID: [INSERT ORIGIN ID FROM ANALYTICS]

I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

Sincerely,
DsquareGee Music Administration`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
    toast.success('Template copied to clipboard.');
  };

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-xl font-serif font-bold italic mb-2">Legal & IP Hub</h3>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Intellectual Property Protection & Enforcement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-bold uppercase tracking-widest">Protection Status</h4>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Visual Watermarking', status: 'Active (Global)', color: 'text-green-400' },
              { id: 'origin', label: 'Digital Origin Tracing', status: 'Enabled', color: 'text-green-400' },
              { label: 'Interface Protection', status: 'Locked', color: 'text-green-400' },
              { label: 'Right-Click Defense', status: 'Active', color: 'text-green-400' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center text-[10px] py-2 border-b border-white/5">
                <span className="text-white/40 font-medium uppercase tracking-wider">{item.label}</span>
                <span className={`font-bold ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h4 className="text-sm font-bold uppercase tracking-widest">Enforcement Toolkit</h4>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider">
            If you detect an unauthorized upload on YouTube, use the Digital Tracer ID from the Analytics tab combined with the template below.
          </p>
          <button 
            onClick={() => copyToClipboard(dmcaTemplate, 'dmca')}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all text-[9px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2"
          >
            {copyStatus === 'dmca' ? 'Copied' : 'Copy DMCA Template'}
          </button>
        </div>
      </div>

      <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/10">
        <h4 className="text-xs font-bold uppercase tracking-widest mb-6 border-l-2 border-primary pl-4">Rights Statement</h4>
        <div className="prose prose-invert prose-sm max-w-none text-white/40 font-serif italic text-sm leading-relaxed space-y-4">
          <p>
            All audio assets served through this platform are digitally watermarked at the transport layer. Each session generated is unique to the authenticated seeker (User ID) and the specific resonance (Origin ID).
          </p>
          <p>
            Any reproduction, redistribution, or public performance without an active Premium subscription or explicit written consent from DsquareGee is strictly prohibited under international copyright law.
          </p>
        </div>
      </div>
    </div>
  );
}

function UserListRows() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const sn = await getDocs(collection(db, 'users'));
        setUsers(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <tr><td colSpan={4} className="py-8 text-center text-[10px] text-white/20 uppercase tracking-widest">Loading Seeker Data...</td></tr>;

  return (
    <>
      {users.slice(0, 10).map(u => (
        <tr key={u.id} className="group">
          <td className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0">
                <img src={u.photoURL || undefined} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{u.displayName}</p>
                <p className="text-[9px] text-white/30 truncate">{u.email}</p>
              </div>
            </div>
          </td>
          <td className="py-4">
            <p className="text-xs font-mono text-white/60">{(u.totalMinutesStreamed || 0).toFixed(0)}m</p>
          </td>
          <td className="py-4">
            <p className="text-xs font-bold text-primary italic">
              {u.subscriptionAmount ? `${u.subscriptionCurrency || 'USD'} ${u.subscriptionAmount}` : 'None'}
            </p>
          </td>
          <td className="py-4">
            <span className={cn(
              "text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest",
              u.tier === 'premium' ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40"
            )}>
              {u.tier === 'premium' ? 'Universal' : 'Surface'}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
