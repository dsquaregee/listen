import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { auth, db } from './lib/firebase';
import { useAuthStore } from './store/useAuthStore';
import { usePlayerStore } from './store/usePlayerStore';
import { UserProfile } from './types';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';

// Layout & Components
import Navbar from './components/Navbar';
import AudioPlayer from './components/AudioPlayer';
import { InstallPrompt } from './components/InstallPrompt';

// Pages
import Home from './pages/Home';
import AlbumDetail from './pages/AlbumDetail';
import CategoryExplore from './pages/CategoryExplore';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Premium from './pages/Premium';

const queryClient = new QueryClient();

export default function App() {
  const { setUser, setLoading } = useAuthStore();
  const { setUserTier } = usePlayerStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex flex-col min-h-screen bg-black text-slate-100 cinematic-gradient-bg">
          <Navbar />
          
          <main className="flex-1 pb-32">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/album/:id" element={<AlbumDetail />} />
              <Route path="/category/:slug" element={<CategoryExplore />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/premium" element={<Premium />} />
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
