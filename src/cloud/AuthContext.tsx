import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { FirebaseAuthentication, type User } from '@capacitor-firebase/authentication';

export type { User };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    FirebaseAuthentication.getCurrentUser()
      .then(({ user }) => {
        if (mounted) setUser(user);
      })
      .catch(() => {
        // web fallback / plugin unavailable — stay signed out
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const listenerPromise = FirebaseAuthentication.addListener('authStateChange', (change) => {
      if (mounted) setUser(change.user);
    });

    return () => {
      mounted = false;
      listenerPromise.then((l) => l.remove());
    };
  }, []);

  async function signInWithGoogle() {
    setError(null);
    setSigningIn(true);
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      setUser(result.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      // The user backing out of the account chooser isn't an error worth
      // surfacing, and the raw native message (e.g. "[16] Cancelled by
      // user.") is never something to show as-is.
      if (!/cancel/i.test(message)) {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  }

  async function signOut() {
    setError(null);
    try {
      await FirebaseAuthentication.signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-out failed. Please try again.');
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signingIn, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
