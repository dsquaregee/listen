import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-3xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Back
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <FileText size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        </div>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing the Infinite Seeker platform, you agree to be bound by these terms. We provide a cinematic audio experience through 'Matrix' (albums) and 'Orbits' (playlists).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. User Account</h2>
            <p>
              Your account is authenticated via Google. You are responsible for maintaining the security of your account and any activity that occurs under it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Premium Subscriptions</h2>
            <p>
              'Infinite Seeker' premium subscriptions grant access to streaming without limitations. These subscriptions are managed by Stripe. We reserve the right to modify pricing with 30 days notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Intellectual Property</h2>
            <p>
              The audio content, visual transformations, and 'Matrix' metadata are protected by copyright. Unauthorized distribution or reverse engineering of the HLS stream is strictly prohibited.
            </p>
          </section>

          <p className="text-xs text-white/30 pt-10">Last updated: May 13, 2026</p>
        </div>
      </motion.div>
    </div>
  );
}
