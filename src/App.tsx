import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
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
          alert('Welcome to Premium! Your payment was successful.');
        } catch (e) {
          console.error('Failed to update tier after payment:', e);
        }
      };
      updateTier();
    } else if (paymentStatus === 'cancelled') {
       navigate('/', { replace: true });
       alert('Payment was cancelled.');
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
          const userDoc = await getDoc(userDocRef);
          const adminEmail = 'dsquaregee@gmail.com';
          const isAdmin = firebaseUser.email === adminEmail;
          const tier = isAdmin ? 'premium' : 'free';
  
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            const finalTier = isAdmin ? 'premium' : userData.tier;
            setUser({ ...userData, isAdmin, tier: finalTier });
            setUserTier(finalTier);
          } else {
            // New user profile - Sync to Firestore
            const initialProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Listener',
              photoURL: firebaseUser.photoURL || '',
              tier,
              isAdmin,
            };
            await setDoc(userDocRef, initialProfile);
            setUser(initialProfile);
            setUserTier(tier);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        setPlaylists([]);
        if (playlistsUnsubscribe) {
          playlistsUnsubscribe();
          playlistsUnsubscribe = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (playlistsUnsubscribe) playlistsUnsubscribe();
    };
  }, [setUser, setLoading, setPlaylists, setUserTier]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
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
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>

          <AudioPlayer />
          <InstallPrompt />
        </div>
      </Router>
    </QueryClientProvider>
  );
}
