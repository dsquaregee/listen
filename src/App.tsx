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
import { handleFirestoreError, OperationType } from './lib/errorHandler';

// Layout & Components
import Navbar from './components/Navbar';
import AudioPlayer from './components/AudioPlayer';
import PremiumGateway from './components/PremiumGateway';
import { InstallPrompt } from './components/InstallPrompt';
import { useLocation, useNavigate } from 'react-router-dom';

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
import PaymentSuccess from './pages/PaymentSuccess';

// Business Pages
import BusinessLayout from './components/business/BusinessLayout';
import BusinessGuard from './components/business/BusinessGuard';
import BusinessDashboard from './pages/business/Dashboard';
import BusinessSchedules from './pages/business/Schedules';
import BusinessScenes from './pages/business/Scenes';
import BusinessAnalytics from './pages/business/Analytics';

import { Toaster, toast } from 'sonner';
import { MOCK_CATEGORIES, MOCK_ALBUMS } from './data/mockData';
import { telemetry } from './services/telemetryService';

const queryClient = new QueryClient();

function TelemetryTracker() {
  const location = useLocation();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      telemetry.trackPageView(location.pathname, !!user);
    }
  }, [location.pathname, user, isLoading]);

  return null;
}

function LegacyPaymentHandler() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'cancelled') {
       toast.info('Manifestation paused. You can continue exploring at any time.');
       navigate('/premium', { replace: true });
    }
  }, [location.search, user, navigate]);

  return null;
}

import CopyrightProtection from './components/CopyrightProtection';

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
        const isMasterAdmin = firebaseUser.email?.toLowerCase() === adminEmail || firebaseUser.uid === 'T9yg2h3VU7c5HSL0Td69Z9FfVQz1';
        let firstSnapshotDone = false;

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
          });

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // User Profile Listener
              userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data() as UserProfile;
              // Admin boost OR explicit beta access OR existing premium tier
              const hasPremiumAccess = isMasterAdmin || userData.betaAccess === true || userData.tier === 'premium' || userData.tier?.startsWith('business');
              const finalTier = hasPremiumAccess ? (userData.tier || 'premium') : userData.tier;
              const finalRole = isMasterAdmin ? 'admin' : (userData.role || 'consumer');

              if (isMasterAdmin) {
                // Ensure admin doc exists
                const adminDocRef = doc(db, 'admins', firebaseUser.uid);
                getDoc(adminDocRef).then(snap => {
                  if (!snap.exists()) {
                    setDoc(adminDocRef, { 
                      email: firebaseUser.email, 
                      role: 'admin', 
                      bootstrapped: true,
                      updatedAt: serverTimestamp() 
                    }).catch(err => console.error('Failed to bootstrap admin doc:', err));
                  }
                });
              }

              setUser({ ...userData, isAdmin: isMasterAdmin || userData.isAdmin, tier: finalTier, role: finalRole });
              setUserTier(finalTier as any);
            } else {
              // Create default profile if missing
              const tier = isMasterAdmin ? 'premium' : 'free';
              const role = isMasterAdmin ? 'admin' : 'consumer';
              
              if (isMasterAdmin) {
                const adminDocRef = doc(db, 'admins', firebaseUser.uid);
                setDoc(adminDocRef, { 
                  email: firebaseUser.email, 
                  role: 'admin', 
                  bootstrapped: true,
                  updatedAt: serverTimestamp() 
                }).catch(err => console.error('Failed to bootstrap admin doc:', err));
              }

              const initialProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Listener',
                photoURL: firebaseUser.photoURL || '',
                tier,
                role,
                isAdmin: isMasterAdmin,
              };
              setDoc(userDocRef, { ...initialProfile, createdAt: serverTimestamp() }, { merge: true })
                .catch(err => console.error('Failed to create initial profile:', err));
              
              setUser({ ...initialProfile, isAdmin: isMasterAdmin });
              setUserTier(tier as any);
            }
            
            if (!firstSnapshotDone) {
              setLoading(false);
              firstSnapshotDone = true;
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
                role: 'admin',
                isAdmin: true
              });
              setUserTier('premium');
            }
            if (!firstSnapshotDone) {
              setLoading(false);
              firstSnapshotDone = true;
            }
          });

        } catch (error) {
          console.error('Auth post-processing error:', error);
          setLoading(false);
        }
      } else {
        setUser(null);
        setPlaylists([]);
        setUserTier('free');
        setLoading(false);
      }
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
        <TelemetryTracker />
        <CopyrightProtection>
          <Toaster position="top-center" theme="dark" closeButton richColors />
          <LegacyPaymentHandler />
          <div className="flex flex-col min-h-screen bg-black text-slate-100 cinematic-gradient-bg">
            <Navbar />
            
            <main className="flex-1 pb-32">
              <Routes>
                {/* Consumer Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/album/:id" element={<AlbumDetail />} />
                <Route path="/category/:slug" element={<CategoryExplore />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/playlist/:id" element={<PlaylistDetail />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/refund" element={<Refund />} />

                {/* Business Pro Routes */}
                <Route element={<BusinessGuard />}>
                  <Route path="/business" element={<BusinessLayout />}>
                    <Route index element={<BusinessDashboard />} />
                    <Route path="dashboard" element={<BusinessDashboard />} />
                    <Route path="schedules" element={<BusinessSchedules />} />
                    <Route path="scenes" element={<BusinessScenes />} />
                    <Route path="analytics" element={<BusinessAnalytics />} />
                  </Route>
                </Route>
              </Routes>
            </main>

            <AudioPlayer />
            <PremiumGateway />
            <InstallPrompt />
          </div>
        </CopyrightProtection>
      </Router>
    </QueryClientProvider>
  );
}
