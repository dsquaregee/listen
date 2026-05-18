import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Music2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function BusinessGuard() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-indigo-500/20"
        >
          <Music2 className="text-white w-8 h-8" />
        </motion.div>
      </div>
    );
  }

  // Allow admins or business users
  const isBusinessUser = user?.role === 'business_basic' || user?.role === 'business_pro';
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  if (!user || (!isBusinessUser && !isAdmin)) {
    return <Navigate to="/premium" replace />;
  }

  return <Outlet />;
}
