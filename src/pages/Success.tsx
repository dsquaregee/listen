import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { doc, setDoc, query, collection, where, getDocs, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Music, ArrowRight, Library } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const albumId = searchParams.get('album_id');

  useEffect(() => {
    async function recordPurchase() {
      if (!profile || !albumId) {
        setLoading(false);
        return;
      }

      try {
        // In a real app, this would be verified via Stripe Webhook
        // For this demo environment, we assume success if they land here
        const purchaseId = `p_${Date.now()}`;
        const purchaseRef = doc(db, 'users', profile.uid, 'purchases', purchaseId);
        
        // Double check if already recorded
        const existingRef = collection(db, 'users', profile.uid, 'purchases');
        const q = query(existingRef, where('albumId', '==', albumId));
        const snap = await getDocs(q);

        if (snap.empty) {
          await setDoc(purchaseRef, {
            id: purchaseId,
            userId: profile.uid,
            albumId: albumId,
            amount: 5,
            stripeSessionId: searchParams.get('session_id') || 'manual_demo',
            createdAt: serverTimestamp()
          });
          toast.success("Purchase recorded in your library!");
        }
      } catch (error) {
        console.error("Error recording purchase:", error);
      } finally {
        setLoading(false);
      }
    }

    recordPurchase();
  }, [profile, albumId]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-white/10 p-12 rounded-3xl text-center max-w-lg w-full relative overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gold" />
        
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-gold/10 text-gold rounded-full flex items-center justify-center animate-bounce-slow">
            <CheckCircle2 size={48} />
          </div>
        </div>

        <h1 className="font-serif text-4xl font-bold mb-4">Journey Unlocked</h1>
        <p className="text-zinc-400 mb-8 text-lg">
          Thank you for supporting immersive fusion. The collection has been added to your personal library forever.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/library"
            className="flex-1 flex items-center justify-center gap-2 bg-gold text-black h-14 rounded-xl font-bold transition-all hover:bg-gold-light"
          >
            <Library size={20} />
            View Library
          </Link>
          <Link 
            to={`/album/${albumId}`}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 text-white h-14 rounded-xl font-bold transition-all hover:bg-zinc-700"
          >
            <Music size={20} />
            Listen Now
            <ArrowRight size={20} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
