'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase/firebase-client';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/UserAuth';
import UserAuth from '../../../components/UserAuth';
import AvatarSelector from '../../../components/AvatarSelector';
import Image from 'next/image';

interface UserRegistration {
  name: string;
  phoneNumber: string;
  avatar?: string;
}

export default function RegisterPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    avatar: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [formPrefilled, setFormPrefilled] = useState(false);

  useEffect(() => {
    console.log('🔍 [REGISTER PAGE] Component mounted', {
      quizId: params.id,
      userId: user?.uid,
      timestamp: new Date().toISOString()
    });

    let isMounted = true;

    const fetchUserProfile = async () => {
      // Only fetch if we have a stable user state
      if (user?.uid) {
        try {
          const userProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
          console.log('🔍 [REGISTER PAGE] User profile check:', {
            exists: userProfileDoc.exists(),
            userId: user.uid
          });
          if (userProfileDoc.exists() && isMounted) {
            const profileData = userProfileDoc.data();
            setFormData({
              name: profileData.name,
              phoneNumber: profileData.phoneNumber,
              avatar: profileData.avatar || '',
            });
          }
        } catch (error) {
          console.error('🔍 [REGISTER PAGE] Error fetching user profile:', error);
        } finally {
          if (isMounted) {
            setFormPrefilled(true);
            setLoading(false);
          }
        }
      } else {
        if (isMounted) {
          setFormPrefilled(true);
          setLoading(false);
        }
      }
    };

    // Only fetch if we have a stable user state
    if (user?.uid) {
      fetchUserProfile();
    } else {
      setFormPrefilled(true);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.uid]); // Only depend on user.uid instead of entire user object

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user?.uid) {
        throw new Error('Please sign in to continue');
      }

      console.log('🔍 [REGISTER PAGE] Starting registration process:', {
        quizId: params.id,
        userId: user.uid,
        formData,
        timestamp: new Date().toISOString()
      });

      // Basic validation
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.phoneNumber.trim()) {
        throw new Error('Phone number is required');
      }

      // Update user profile with any changes
      await setDoc(doc(db, 'userProfiles', user.uid), {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        avatar: formData.avatar || null,
      }, { merge: true });

      console.log('🔍 [REGISTER PAGE] User profile updated');

      // Create quiz registration document
      const registrationRef = doc(db, 'quizRegistrations', `${params.id}_${user.uid}`);
      await setDoc(registrationRef, {
        userId: user.uid,
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        avatar: formData.avatar || null,
        quizId: params.id,
        createdAt: new Date().toISOString(),
      });

      console.log('🔍 [REGISTER PAGE] Quiz registration created:', {
        registrationRef: registrationRef.path,
        userId: user.uid
      });

      // Store user info in session storage for quiz completion
      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('userName', formData.name.trim());
      sessionStorage.setItem('quizId', params.id);

      console.log('🔍 [REGISTER PAGE] Redirecting to take page');
      
      // Use replace to prevent back navigation
      router.replace(`/quiz/${params.id}/take`);
    } catch (error) {
      console.error('🔍 [REGISTER PAGE] Registration error:', error);
      setError(error instanceof Error ? error.message : 'Failed to register');
      setLoading(false);
    }
  };

  if (!user) {
    return <UserAuth />;
  }

  if (!formPrefilled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Register for Quiz
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please provide your information to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="sr-only">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 