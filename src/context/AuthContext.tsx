import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { useToast } from './ToastContext';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail, 
  confirmPasswordReset,
  updatePassword as firebaseUpdatePassword,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export interface DbUser {
  id: string;
  full_name: string;
  email: string;
  business_name: string | null;
  avatar: string | null;
  created_at: string;
}

interface AuthContextType {
  user: DbUser | null;
  session: FirebaseUser | null;
  loading: boolean;
  isSupabaseConfigured: boolean; // Keep name for backwards compatibility in UI pages
  signUp: (email: string, password: string, fullName: string, businessName: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<DbUser>) => Promise<{ success: boolean; error?: string }>;
  enterSandboxMode: (email?: string, name?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DbUser | null>(null);
  const [session, setSession] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Load user profile from Firestore 'users' collection
  const fetchUserProfile = async (userId: string): Promise<DbUser | null> => {
    if (!isFirebaseConfigured || !auth.currentUser) return null;
    const path = `users/${userId}`;
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as DbUser;
      }
      return null;
    } catch (err: any) {
      console.error('Error loading user profile from Firestore:', err);
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      return null;
    }
  };

  // Helper to sync state (either Firebase Auth or Mock fallback)
  useEffect(() => {
    let unsubscribe: any;

    const initializeAuth = async () => {
      setLoading(true);
      if (isFirebaseConfigured) {
        try {
          // Listen for Firebase auth state changes
          unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              setSession(firebaseUser);
              const profile = await fetchUserProfile(firebaseUser.uid);
              if (profile) {
                setUser(profile);
              } else {
                // Recover/Create Firestore user profile if missing
                const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || 'User')}`;
                const newProfile: DbUser = {
                  id: firebaseUser.uid,
                  full_name: firebaseUser.displayName || 'Valued Member',
                  email: firebaseUser.email || '',
                  business_name: '',
                  avatar: defaultAvatar,
                  created_at: new Date().toISOString(),
                };
                
                try {
                  await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
                } catch (writeErr: any) {
                  console.error('Failed to auto-create missing user profile:', writeErr);
                  if (writeErr && typeof writeErr === 'object') {
                    console.error('[Firebase Detailed Error] Code:', writeErr.code, 'Message:', writeErr.message, 'Full Details:', writeErr);
                  }
                }
                setUser(newProfile);
              }
            } else {
              setSession(null);
              setUser(null);
            }
            setLoading(false);
          });
        } catch (error: any) {
          console.error('Firebase Auth listener failure:', error);
          if (error && typeof error === 'object') {
            console.error('[Firebase Detailed Error] Code:', error.code, 'Message:', error.message, 'Stack:', error.stack, 'Full Details:', error);
          }
          showToast('error', 'Authentication service failed to initialize.', 'System Error');
          setLoading(false);
        }
      } else {
        // MOCK PERSISTENT FALLBACK ENGINE (For local/sandbox execution)
        const storedUser = localStorage.getItem('bizpilot_mock_user');
        const storedSession = localStorage.getItem('bizpilot_mock_session');
        if (storedUser && storedSession) {
          setUser(JSON.parse(storedUser));
          // Mock FirebaseUser structures
          setSession({
            uid: JSON.parse(storedUser).id,
            email: JSON.parse(storedUser).email,
            displayName: JSON.parse(storedUser).full_name
          } as any);
        }
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showToast]);

  // Sign Up / Register
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    businessName: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseConfigured) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Set Auth Display Name
        await firebaseUpdateProfile(firebaseUser, { displayName: fullName });

        const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
        const profileUser: DbUser = {
          id: firebaseUser.uid,
          full_name: fullName,
          email: email,
          business_name: businessName,
          avatar: defaultAvatar,
          created_at: new Date().toISOString(),
        };

        // Save profile document in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), profileUser);

        setUser(profileUser);
        setSession(firebaseUser);
        showToast('success', 'Your account has been created successfully!', 'Welcome!');
        return { success: true };
      } catch (err: any) {
        console.error('Registration error:', err);
        if (err && typeof err === 'object') {
          console.error('[Firebase Detailed Error] Code:', err.code, 'Message:', err.message, 'Stack:', err.stack, 'Full Error Object:', err);
        }
        return { success: false, error: err.message || 'An unexpected error occurred.' };
      }
    } else {
      // Mock flow
      const mockId = Math.random().toString(36).substring(2, 11);
      const mockUser: DbUser = {
        id: mockId,
        full_name: fullName,
        email,
        business_name: businessName,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem('bizpilot_mock_user', JSON.stringify(mockUser));
      localStorage.setItem('bizpilot_mock_session', 'true');
      setUser(mockUser);
      setSession({ uid: mockId, email, displayName: fullName } as any);
      showToast('success', 'Sandbox Account registered successfully! (Mock storage)', 'Welcome!');
      return { success: true };
    }
  };

  // Sign In / Login
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseConfigured) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        setSession(firebaseUser);

        const profile = await fetchUserProfile(firebaseUser.uid);
        if (profile) {
          setUser(profile);
        } else {
          // Dynamic profile recovery if row is missing in Firestore
          const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || 'User')}`;
          const recovered: DbUser = {
            id: firebaseUser.uid,
            full_name: firebaseUser.displayName || 'Valued Member',
            email: firebaseUser.email || '',
            business_name: '',
            avatar: defaultAvatar,
            created_at: new Date().toISOString(),
          };
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), recovered);
          } catch (recoveryErr) {
            console.error('Failed profile auto-recovery writing to Firestore:', recoveryErr);
          }
          setUser(recovered);
        }
        showToast('success', 'Logged in successfully. Welcome back!', 'Success');
        return { success: true };
      } catch (err: any) {
        console.error('Login error:', err);
        if (err && typeof err === 'object') {
          console.error('[Firebase Detailed Error] Code:', err.code, 'Message:', err.message, 'Stack:', err.stack, 'Full Error Object:', err);
        }
        return { success: false, error: err.message || 'Failed to authenticate. Please check credentials.' };
      }
    } else {
      // Mock Sign In
      const storedUserRaw = localStorage.getItem('bizpilot_mock_user');
      let matchedUser: DbUser;

      if (storedUserRaw) {
        const storedUser = JSON.parse(storedUserRaw) as DbUser;
        if (storedUser.email.toLowerCase() === email.toLowerCase()) {
          matchedUser = storedUser;
        } else {
          matchedUser = {
            id: 'mock-default-id',
            full_name: 'Dayo Samuel',
            email: email,
            business_name: 'Pioneer Operatives LLC',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent('Dayo Samuel')}`,
            created_at: new Date().toISOString(),
          };
        }
      } else {
        matchedUser = {
          id: 'mock-default-id',
          full_name: 'Dayo Samuel',
          email: email,
          business_name: 'Pioneer Operatives LLC',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent('Dayo Samuel')}`,
          created_at: new Date().toISOString(),
        };
      }

      localStorage.setItem('bizpilot_mock_user', JSON.stringify(matchedUser));
      localStorage.setItem('bizpilot_mock_session', 'true');
      setUser(matchedUser);
      setSession({ uid: matchedUser.id, email, displayName: matchedUser.full_name } as any);
      showToast('success', 'Logged in successfully (Mock Sandbox Mode).', 'Success');
      return { success: true };
    }
  };

  // Google Sign-In
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseConfigured) {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const firebaseUser = userCredential.user;
        setSession(firebaseUser);

        const profile = await fetchUserProfile(firebaseUser.uid);
        if (profile) {
          setUser(profile);
        } else {
          const defaultAvatar = firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || 'User')}`;
          const newProfile: DbUser = {
            id: firebaseUser.uid,
            full_name: firebaseUser.displayName || 'Valued Member',
            email: firebaseUser.email || '',
            business_name: '',
            avatar: defaultAvatar,
            created_at: new Date().toISOString(),
          };
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          } catch (recoveryErr) {
            console.error('Failed profile creation during Google Sign In:', recoveryErr);
          }
          setUser(newProfile);
        }
        showToast('success', 'Logged in successfully with Google!', 'Welcome!');
        return { success: true };
      } catch (err: any) {
        console.error('Google Sign In error:', err);
        if (err && typeof err === 'object') {
          console.error('[Firebase Detailed Error] Code:', err.code, 'Message:', err.message, 'Stack:', err.stack, 'Full Error Object:', err);
        }
        return { success: false, error: err.message || 'Google Authentication failed.' };
      }
    } else {
      // Mock Google Login
      const mockId = 'mock-google-id';
      const mockUser: DbUser = {
        id: mockId,
        full_name: 'Dayo Samuel (Google)',
        email: 'dayosamuel54@gmail.com',
        business_name: 'Google Pioneer Inc',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=GoogleUser',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('bizpilot_mock_user', JSON.stringify(mockUser));
      localStorage.setItem('bizpilot_mock_session', 'true');
      setUser(mockUser);
      setSession({ uid: mockId, email: mockUser.email, displayName: mockUser.full_name } as any);
      showToast('success', 'Logged in with Mock Google Account.', 'Success');
      return { success: true };
    }
  };

  // Emergency / developer bypass sandbox login
  const enterSandboxMode = (email?: string, name?: string) => {
    const mockId = 'mock-sandbox-bypass';
    const mockUser: DbUser = {
      id: mockId,
      full_name: name || 'Dayo Samuel (Sandbox)',
      email: email || 'dayosamuel54@gmail.com',
      business_name: 'Pioneer Operatives LLC',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Dayo Samuel')}`,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('bizpilot_mock_user', JSON.stringify(mockUser));
    localStorage.setItem('bizpilot_mock_session', 'true');
    setUser(mockUser);
    setSession({ uid: mockId, email: mockUser.email, displayName: mockUser.full_name } as any);
    showToast('success', 'Entered developer Sandbox offline fallback mode successfully.', 'Sandbox Mode');
  };

  // Sign Out / Logout
  const signOut = async () => {
    if (isFirebaseConfigured) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error('Error signing out of Firebase:', err);
      }
    }

    // Clean local mock storage & states
    localStorage.removeItem('bizpilot_mock_user');
    localStorage.removeItem('bizpilot_mock_session');
    setUser(null);
    setSession(null);
    showToast('info', 'You have been signed out.', 'Logged Out');
  };

  // Reset password email dispatch
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseConfigured) {
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('success', 'A password reset link has been dispatched to your email!', 'Email Sent');
        return { success: true };
      } catch (err: any) {
        console.error('Password reset dispatch error:', err);
        if (err && typeof err === 'object') {
          console.error('[Firebase Detailed Error] Code:', err.code, 'Message:', err.message, 'Stack:', err.stack, 'Full Error Object:', err);
        }
        return { success: false, error: err.message || 'Error executing request.' };
      }
    } else {
      showToast('success', 'A mock password reset link has been dispatched to ' + email, 'Success');
      return { success: true };
    }
  };

  // Update password / Recovery reset password
  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseConfigured) {
      try {
        if (auth.currentUser) {
          await firebaseUpdatePassword(auth.currentUser, password);
          showToast('success', 'Your password has been updated successfully!', 'Updated');
          return { success: true };
        } else {
          // Check for Firebase Action Code 'oobCode' in URL
          const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '');
          const oobCode = urlParams.get('oobCode');
          if (oobCode) {
            await confirmPasswordReset(auth, oobCode, password);
            showToast('success', 'Your password has been reset successfully! Please log in.', 'Updated');
            return { success: true };
          }
          return { success: false, error: 'No active session or valid reset code found in URL.' };
        }
      } catch (err: any) {
        console.error('Update password error:', err);
        if (err && typeof err === 'object') {
          console.error('[Firebase Detailed Error] Code:', err.code, 'Message:', err.message, 'Stack:', err.stack, 'Full Error Object:', err);
        }
        return { success: false, error: err.message || 'Error updating password.' };
      }
    } else {
      showToast('success', 'Mock password changed successfully.', 'Updated');
      return { success: true };
    }
  };

  // Update user profile metadata in Firestore
  const updateProfile = async (updates: Partial<DbUser>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No authenticated user session found.' };

    if (updates.avatar && updates.avatar.length > 65000) {
      const msg = 'Avatar image is too large for database storage. Please select a smaller or cropped image.';
      showToast('error', msg, 'Profile Error');
      return { success: false, error: msg };
    }

    const mergedUser = { ...user, ...updates };

    if (isFirebaseConfigured && auth.currentUser) {
      const path = `users/${user.id}`;
      try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, {
          full_name: mergedUser.full_name,
          business_name: mergedUser.business_name,
          avatar: mergedUser.avatar,
        }, { merge: true });

        if (auth.currentUser && updates.full_name) {
          await firebaseUpdateProfile(auth.currentUser, { displayName: updates.full_name });
        }

        setUser(mergedUser);
        showToast('success', 'Your profile details have been synced.', 'Success');
        return { success: true };
      } catch (err: any) {
        console.error('Profile update error:', err);
        if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
        return { success: false, error: err.message || 'Profile sync failed.' };
      }
    } else {
      localStorage.setItem('bizpilot_mock_user', JSON.stringify(mergedUser));
      setUser(mergedUser);
      showToast('success', 'Profile details updated (Mock Storage).', 'Success');
      return { success: true };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isSupabaseConfigured: isFirebaseConfigured, // Exposed with backwards-compatible state name
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        enterSandboxMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
