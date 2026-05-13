import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
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
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
            <Shield size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        </div>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>
              We collect your name, email, and profile picture via Google Authentication. We also track 'Minutes Streamed' and your interactions with 'Matrix' albums to personalize your experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Data</h2>
            <p>
              Your data is used to maintain your 'Orbits', handle subscription status via Stripe, and improve our AI-driven metadata generation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Security</h2>
            <p>
              We use industry-standard encryption and Firebase Security Rules to ensure your personal data and configuration remain private as per Zero-Trust principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Cookies</h2>
            <p>
              We use local storage and standard session cookies for authentication and to store your playback preferences (volume, shuffle settings).
            </p>
          </section>

          <p className="text-xs text-white/30 pt-10">Last updated: May 13, 2026</p>
        </div>
      </motion.div>
    </div>
  );
}
