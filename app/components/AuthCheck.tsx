'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, getAuth, Auth } from 'firebase/auth';
import { auth } from '../lib/firebase/firebase-client';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AuthCheck mounted, setting up auth listener');
    
    try {
      // Wait for Firebase to be initialized
      if (typeof window === 'undefined') {
        console.log('Running on server, skipping auth check');
        return;
      }

      // Verify auth is initialized
      if (!auth) {
        console.log('Auth not initialized yet, waiting...');
        return;
      }

      const unsubscribe = onAuthStateChanged(auth as Auth, 
        (user) => {
          console.log('Auth state changed:', { 
            hasUser: !!user,
            userId: user?.uid,
            loading: false 
          });
          
          if (!user) {
            console.log('No user found, redirecting to login');
            router.push('/login');
          } else {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Auth state error:', error);
          setError(error.message);
          setLoading(false);
        }
      );

      return () => {
        console.log('AuthCheck unmounting, cleaning up auth listener');
        unsubscribe();
      };
    } catch (err) {
      console.error('Error in AuthCheck:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    console.log('AuthCheck: Loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    console.log('AuthCheck: Error state', { error });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-red-800 font-medium">Authentication Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('AuthCheck: Rendering children');
  return <>{children}</>;
} 