'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../components/UserAuth';
import { db } from '../../lib/firebase/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import UserInfoBadge from '../../components/predict-this/UserInfoBadge';
import { staggerContainer, staggerItem } from '../../../lib/motion';

export default function PredictThisMenu() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        // Should never happen with anonymous auth, but handle gracefully
        setUserName('Guest');
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db as any, 'userProfiles', user.uid);
        const profileDoc = await getDoc(profileRef);

        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          setUserName(profileData.name || 'User');
          setUserAvatar(profileData.avatar);
        } else {
          // No profile yet - anonymous user hasn't registered
          // Show default name, they'll register when submitting a quiz
          setUserName('Guest');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Don't block access on error - show default
        setUserName('Guest');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172A]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172A]">
      {/* User Info Badge - Top Right Mobile, More Prominent Desktop */}
      <UserInfoBadge
        name={userName}
        avatar={userAvatar}
        className="absolute top-4 right-4 md:top-8 md:right-8"
      />

      {/* Main Menu */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="integral-title text-white text-center mb-16"
          style={{ fontSize: '48px' }}
        >
          YOUR QUIZZES
        </motion.h1>

        {/* Two Main Options */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Create Quiz Card */}
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3 }}
            onClick={() => router.push('/bracket/admin/create-quiz')}
            className="cursor-pointer"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F58143] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white font-['PP_Object_Sans']">
                  Create a Quiz
                </h2>
                <p className="text-white/60 font-['PP_Object_Sans']">
                  Build your own prediction challenge
                </p>
              </div>
            </div>
          </motion.div>

          {/* View Quizzes Card */}
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3 }}
            onClick={() => router.push('/predict-this/my-quizzes')}
            className="cursor-pointer"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#38bdf8] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white font-['PP_Object_Sans']">
                  My Quizzes
                </h2>
                <p className="text-white/60 font-['PP_Object_Sans']">
                  View and manage your quizzes
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
