import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Music2, 
  Smartphone, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/business/dashboard' },
  { icon: Music2, label: 'Scenes', path: '/business/scenes' },
  { icon: Calendar, label: 'Schedules', path: '/business/schedules' },
  { icon: BarChart3, label: 'Analytics', path: '/business/analytics' },
];

export default function BusinessLayout() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="relative flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-3xl z-40 transition-all duration-300 ease-in-out"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Music2 className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">Business Pro</h1>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Operating System</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5", isCollapsed ? "mx-auto" : "")} />
                  {!isCollapsed && (
                    <span className="font-medium tracking-wide">{item.label}</span>
                  )}
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-1">
          <NavLink
            to="/business/settings"
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group",
              isActive ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
            )}
          >
            <Settings className={cn("w-5 h-5", isCollapsed ? "mx-auto" : "")} />
            {!isCollapsed && <span className="font-medium">Settings</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-all duration-300"
          >
            <LogOut className={cn("w-5 h-5", isCollapsed ? "mx-auto" : "")} />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-6 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-widest">
              Venue: {user?.displayName || 'My Venue'}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-500 font-medium">Online</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ') || 'Owner'}</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-slate-800">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-sm font-bold">
                  {user?.displayName?.charAt(0) || 'B'}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 pb-12 flex-1">
          <Outlet />
        </div>
      </main>

      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-indigo-600/5 blur-[160px] rounded-full translate-x-1/2 -translate-y-1/2 overflow-hidden pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-purple-600/5 blur-[140px] rounded-full -translate-x-1/3 translate-y-1/3 overflow-hidden pointer-events-none" />
    </div>
  );
}
