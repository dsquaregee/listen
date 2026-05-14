import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { auth, db } from './lib/firebase';
import { useAuthStore } from './store/useAuthStore';
import { usePlayerStore } from './store/usePlayerStore';
import { useUserStore } from './store/useUserStore';
import { UserProfile } from './types';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';

// Layout & Components
import Navbar from './components/Navbar';
import AudioPlayer from './components/AudioPlayer';
import PremiumGateway from './components/PremiumGateway';
import { InstallPrompt } from './components/InstallPrompt';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateDoc } from 'firebase/firestore';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import AlbumDetail from './pages/AlbumDetail';
import CategoryExplore from './pages/CategoryExplore';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Premium from './pages/Premium';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';

import { Toaster, toast } from 'sonner';

const queryClient = new QueryClient();

function PaymentHandler() {
  const { user, setUser } = useAuthStore();
  const { setUserTier } = usePlayerStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success' && user && user.tier !== 'premium') {
      const updateTier = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const updateData = {
            tier: 'premium' as const,
            isPremium: true,
            updatedAt: new Date().toISOString()
          };
          await updateDoc(userRef, updateData);
          setUser({ ...user, ...updateData });
          setUserTier('premium');
          
          // Clear query params
          navigate('/', { replace: true });
          toast.success('Welcome to Premium! Your payment was successful.');
        } catch (e) {
          console.error('Failed to update tier after payment:', e);
        }
      };
      updateTier();
    } else if (paymentStatus === 'cancelled') {
       navigate('/', { replace: true });
       toast.error('Payment was cancelled.');
    }
  }, [location.search, user, setUser, setUserTier, navigate]);

  return null;
}

export default function App() {
  const { setUser, setLoading } = useAuthStore();
  const { setUserTier } = usePlayerStore();
  const { setPlaylists } = useUserStore();

  useEffect(() => {
    let playlistsUnsubscribe: (() => void) | null = null;
    let userUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clear previous listeners if any (shouldn't happen with standard onAuthStateChanged but for safety)
      if (playlistsUnsubscribe) playlistsUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();

      if (firebaseUser) {
        try {
          // Playlists Listener
          const plQuery = query(
            collection(db, 'playlists'),
            where('userId', '==', firebaseUser.uid),
            orderBy('createdAt', 'desc')
          );

          playlistsUnsubscribe = onSnapshot(plQuery, (snapshot) => {
            const plys = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as any[];
            setPlaylists(plys);
          }, (err) => {
            handleFirestoreError(err, OperationType.GET, 'playlists');
          });

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // User Profile Listener
          userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data() as UserProfile;
              const adminEmails = ['dsquaregee@gmail.com'];
              const isAdmin = adminEmails.includes(firebaseUser.email || '');
              const finalTier = isAdmin && !userData.stripeCustomerId ? 'premium' : userData.tier;
              setUser({ ...userData, isAdmin, tier: finalTier });
              setUserTier(finalTier);
            } else {
              // Create default profile if missing
              const adminEmail = 'dsquaregee@gmail.com';
              const isAdmin = firebaseUser.email === adminEmail;
              const tier = isAdmin ? 'premium' : 'free';
              
              const initialProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Listener',
                photoURL: firebaseUser.photoURL || '',
                tier,
                isAdmin,
              };
              setDoc(userDocRef, { ...initialProfile, createdAt: new Date().toISOString() });
            }
          }, (err) => {
            handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          });

        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        setPlaylists([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (playlistsUnsubscribe) playlistsUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, [setUser, setLoading, setPlaylists, setUserTier]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-center" theme="dark" closeButton richColors />
        <PaymentHandler />
        <div className="flex flex-col min-h-screen bg-black text-slate-100 cinematic-gradient-bg">
          <Navbar />
          
          <main className="flex-1 pb-32">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/album/:id" element={<AlbumDetail />} />
              <Route path="/category/:slug" element={<CategoryExplore />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlist/:id" element={<PlaylistDetail />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund" element={<Refund />} />
            </Routes>
          </main>

          <AudioPlayer />
          <PremiumGateway />
          <InstallPrompt />
        </div>
      </Router>
    </QueryClientProvider>
  );
}
