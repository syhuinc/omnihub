import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { FirebaseAuthentication, type User } from '@capacitor-firebase/authentication';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import { deleteAccountAndData } from './deleteAccount';

export type { User };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  deletingAccount: boolean;
  error: string | null;
  /** Pro entitlement, read live from the user's Firestore doc (server-write-only — see
   *  firestore.rules). False while signed out or before the first snapshot arrives. */
  isPro: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Permanently deletes the signed-in user's synced data and their account. Throws on failure. */
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

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

  // Live Pro-status listener, re-attached whenever the signed-in user changes. The doc is
  // server-write-only (see firestore.rules), so this only ever reflects what the backend set.
  useEffect(() => {
    if (!user) {
      setIsPro(false);
      return;
    }
    let mounted = true;
    let callbackId: string | null = null;

    FirebaseFirestore.addDocumentSnapshotListener<{ isPro?: boolean }>(
      { reference: `users/${user.uid}` },
      (event) => {
        if (mounted) setIsPro(event?.snapshot.data?.isPro === true);
      },
    )
      .then((id) => {
        callbackId = id;
      })
      .catch(() => {
        // web fallback / plugin unavailable — stay non-Pro rather than block the app
      });

    return () => {
      mounted = false;
      if (callbackId) FirebaseFirestore.removeSnapshotListener({ callbackId });
    };
  }, [user]);

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

  async function deleteAccount() {
    if (!user) throw new Error('Not signed in.');
    setError(null);
    setDeletingAccount(true);
    try {
      await deleteAccountAndData(user.uid, async () => {
        await FirebaseAuthentication.signInWithGoogle();
      });
      setUser(null);
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signingIn, deletingAccount, error, isPro, signInWithGoogle, signOut, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
