import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Refund() {
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
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
            <RotateCcw size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Refund Policy</h1>
        </div>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Refund Eligibility</h2>
            <p>
              Infinite Seeker offers a 14-day refund period for initial subscription payments. If you are unsatisfied with the quality of the HLS stream or AI features, you may request a refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Processing Time</h2>
            <p>
              Refunds are processed via Stripe and may take 5-10 business days to appear on your bank statement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How to Request</h2>
            <p>
              To request a refund, please contact support@dsquaregee.com with your Order ID and the email address associated with your Google account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Cancellations</h2>
            <p>
              You can cancel your subscription at any time through the Billing Portal. Cancellations stop future billing but do not automatically trigger a refund for the current period unless requested within the 14-day window.
            </p>
          </section>

          <p className="text-xs text-white/30 pt-10">Last updated: May 13, 2026</p>
        </div>
      </motion.div>
    </div>
  );
}
