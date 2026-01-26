'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { auth } from '../firebase/firebase-client';

/**
 * Hook that provides auth state with the ability to wait for auth to be ready.
 * Use this when you need to ensure authentication is available before an action.
 *
 * - Tracks auth initialization state
 * - Auto-signs in anonymously if no user (matching existing UserAuth behavior)
 * - Provides refreshAuth() to validate/refresh auth before critical operations
 */
export function useAuthReady() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setAuthError('Firebase Auth not initialized');
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth as any,
      async (currentUser) => {
        if (!currentUser) {
          // Auto sign-in anonymously (consistent with existing UserAuth.tsx behavior)
          try {
            const result = await signInAnonymously(auth as any);
            setUser(result.user);

            // Record device fingerprint
            if (typeof window !== 'undefined') {
              try {
                const { recordDeviceFingerprint } = await import('../deviceFingerprint');
                await recordDeviceFingerprint(result.user.uid);
              } catch (fpError) {
                console.error('[useAuthReady] Error recording fingerprint:', fpError);
              }
            }
          } catch (error) {
            console.error('[useAuthReady] Error signing in anonymously:', error);
            setAuthError(error instanceof Error ? error.message : 'Auth failed');
          }
        } else {
          setUser(currentUser);
        }
        setAuthReady(true);
      },
      (error) => {
        console.error('[useAuthReady] Auth state error:', error);
        setAuthError(error.message);
        setAuthReady(true);
      }
    );

    return unsubscribe;
  }, []);

  /**
   * Refresh/validate current auth state and return the user.
   * This ensures we have a valid, authenticated user before critical operations.
   *
   * - If user exists, validates the token is still valid
   * - If no user, attempts anonymous sign-in
   * - Throws an error if auth cannot be established
   */
  const refreshAuth = useCallback(async (): Promise<User> => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    // If we have a current user, validate the token
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // Force token refresh to ensure auth is still valid
        await currentUser.getIdToken(true);
        return currentUser;
      } catch (error) {
        console.warn('[useAuthReady] Token refresh failed, re-authenticating:', error);
        // Token refresh failed, fall through to re-authenticate
      }
    }

    // No valid user, attempt anonymous sign-in
    try {
      const result = await signInAnonymously(auth as any);
      setUser(result.user);

      // Record device fingerprint
      if (typeof window !== 'undefined') {
        try {
          const { recordDeviceFingerprint } = await import('../deviceFingerprint');
          await recordDeviceFingerprint(result.user.uid);
        } catch (fpError) {
          console.error('[useAuthReady] Error recording fingerprint:', fpError);
        }
      }

      return result.user;
    } catch (error) {
      console.error('[useAuthReady] Failed to authenticate:', error);
      throw new Error('Authentication failed. Please refresh the page and try again.');
    }
  }, []);

  return { user, authReady, authError, refreshAuth };
}
