import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
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
import { MOCK_CATEGORIES, MOCK_ALBUMS } from './data/mockData';

const queryClient = new QueryClient();

function UniverseRestorer() {
  const { user } = useAuthStore();

  useEffect(() => {
    const checkAndRestore = async () => {
      if (!user || !user.isAdmin) return;

      try {
        const catSn = await getDocs(collection(db, 'categories'));
        const albSn = await getDocs(collection(db, 'albums'));

        if (catSn.empty || albSn.empty) {
          console.log('Database universe incomplete, restoring data...');
          const toastId = toast.loading('Synchronizing Atmosphere Universe...');
          
          // Seed Categories
          for (const cat of MOCK_CATEGORIES) {
            await setDoc(doc(db, 'categories', cat.id), {
              ...cat,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          
          // Seed Albums
          for (const album of MOCK_ALBUMS) {
            await setDoc(doc(db, 'albums', album.id), {
              ...album,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              playCount: 0
            }, { merge: true });
          }
          
          toast.success('Universe Data Restored Successfully!', { id: toastId });
          window.location.reload(); // Refresh to show data
        }
      } catch (err) {
        console.error('Auto-restoration failed:', err);
      }
    };

    checkAndRestore();
  }, [user]);

  return null;
}

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
      if (playlistsUnsubscribe) {
        playlistsUnsubscribe();
        playlistsUnsubscribe = null;
      }
      if (userUnsubscribe) {
        userUnsubscribe();
        userUnsubscribe = null;
      }

      if (firebaseUser) {
        const adminEmail = 'dsquaregee@gmail.com';
        const isMasterAdmin = firebaseUser.email?.toLowerCase() === adminEmail;

        try {
          // Playlists Listener
          const plQuery = query(
            collection(db, 'playlists'),
            where('userId', '==', firebaseUser.uid)
          );

          playlistsUnsubscribe = onSnapshot(plQuery, (snapshot) => {
            const plys = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as any[];
            setPlaylists(plys);
          }, (err) => {
            console.error('Playlists listener error:', err);
            // Don't toast here as it might be an index issue or just temporary
          });

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // User Profile Listener
          userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data() as UserProfile;
              const finalTier = isMasterAdmin && !userData.stripeCustomerId ? 'premium' : userData.tier;
              setUser({ ...userData, isAdmin: isMasterAdmin || userData.isAdmin, tier: finalTier });
              setUserTier(finalTier);
            } else if (isMasterAdmin) {
              // Create default profile if missing for admin
              const tier = 'premium';
              
              const initialProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Listener',
                photoURL: firebaseUser.photoURL || '',
                tier,
                isAdmin: isMasterAdmin,
              };
              setDoc(userDocRef, { ...initialProfile, createdAt: serverTimestamp() }, { merge: true })
                .catch(err => console.error('Failed to create initial profile:', err));
              
              setUser({ ...initialProfile, isAdmin: isMasterAdmin });
              setUserTier(tier);
            }
          }, (err) => {
            console.error('User listener error:', err);
            // Fallback for master admin if doc fetch fails (e.g. initial setup)
            if (isMasterAdmin) {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Admin',
                photoURL: firebaseUser.photoURL || '',
                tier: 'premium',
                isAdmin: true
              });
              setUserTier('premium');
            }
          });

        } catch (error) {
          console.error('Auth post-processing error:', error);
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
        <UniverseRestorer />
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
