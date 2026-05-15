import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Listener',
            photoURL: user.photoURL || '',
            isAdmin: user.email === 'dsquaregee@gmail.com', // Initial admin bootstrap
            tier: 'free',
            createdAt: serverTimestamp() as any,
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Force account selection to avoid automatic "appears and disappears"
      provider.setCustomParameters({ prompt: 'select_account' });
      
      console.log("Attempting signInWithPopup...");
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      
      let errorMessage = "Login failed. ";
      
      if (error.code === 'auth/popup-closed-by-user') {
        return; // Normal exit
      }
      
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        errorMessage = `Domain "${domain}" is not authorized in your Firebase project. \n\nGo to Firebase Console > Authentication > Settings > Authorized domains and add "${domain}".`;
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "The login popup was blocked by your browser. Please allow popups for this site.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "A previous login popup was already open.";
      } else {
        errorMessage += error.message || "Unknown error.";
      }
      
      // If popup fails, suggest redirect
      if (window.confirm(`${errorMessage}\n\nWould you like to try signing in via redirect instead? (This is usually more reliable on some browsers)`)) {
        try {
          const provider = new GoogleAuthProvider();
          const { signInWithRedirect } = await import('firebase/auth');
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          console.error("Redirect Error:", redirectError);
          alert("Redirect login also failed.");
        }
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
