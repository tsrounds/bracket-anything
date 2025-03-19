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

export default function QuizRegistration({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<UserRegistration>({
    name: '',
    phoneNumber: '',
    avatar: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
          if (userProfileDoc.exists()) {
            const profileData = userProfileDoc.data();
            setFormData({
              name: profileData.name,
              phoneNumber: profileData.phoneNumber,
              avatar: profileData.avatar || '',
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('Please sign in to continue');
      }

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

      // Store user info in session storage for quiz completion
      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('userName', formData.name.trim());
      sessionStorage.setItem('quizId', params.id);

      // Redirect to quiz
      router.push(`/quiz/${params.id}/take`);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <UserAuth />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Register for Quiz</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
              <AvatarSelector 
                onAvatarSelect={(avatar) => setFormData(prev => ({ ...prev, avatar }))}
                initialAvatar={formData.avatar}
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your phone number"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400"
              >
                {loading ? 'Registering...' : 'Continue to Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 