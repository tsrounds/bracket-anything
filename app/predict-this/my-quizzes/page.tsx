'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../components/UserAuth';
import { db } from '../../lib/firebase/firebase-client';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import UserInfoBadge from '../../components/predict-this/UserInfoBadge';
import { Quiz } from '../../lib/predict-this/types';
import { staggerContainer, staggerItem } from '../../../lib/motion';

export default function MyQuizzes() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        router.push('/predict-this/register');
        return;
      }

      try {
        // Fetch user profile
        const { doc, getDoc } = await import('firebase/firestore');
        const profileRef = doc(db as any, 'userProfiles', user.uid);
        const profileDoc = await getDoc(profileRef);

        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          setUserName(profileData.name || 'User');
          setUserAvatar(profileData.avatar);
        }

        // Fetch quizzes created by this user
        const quizzesQuery = query(
          collection(db as any, 'quizzes'),
          where('creatorId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const quizzesSnapshot = await getDocs(quizzesQuery);
        const quizzesList = quizzesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Quiz[];

        setQuizzes(quizzesList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleQuizClick = (quizId: string, status: string) => {
    if (status === 'completed') {
      // Go to leaderboard/results
      router.push(`/bracket/quiz/${quizId}/thank-you`);
    } else {
      // Go to quiz detail/share page
      window.open(`/bracket/quiz/${quizId}`, '_blank');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172A]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172A]">
      {/* User Info Badge */}
      <UserInfoBadge
        name={userName}
        avatar={userAvatar}
        className="absolute top-4 right-4 md:top-8 md:right-8"
      />

      {/* Back Button */}
      <button
        onClick={() => router.push('/predict-this/menu')}
        className="absolute top-4 left-4 md:top-8 md:left-8 text-white/60 hover:text-white transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="integral-title text-white text-center mb-12"
          style={{ fontSize: '48px' }}
        >
          MY QUIZZES
        </motion.h1>

        {quizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <p className="text-white/60 font-['PP_Object_Sans'] text-lg mb-6">
              You haven't created any quizzes yet
            </p>
            <button
              onClick={() => router.push('/bracket/admin/create-quiz')}
              className="px-6 py-3 bg-[#F58143] text-white rounded-lg font-['PP_Object_Sans'] hover:bg-[#ffa366] transition-colors"
            >
              Create Your First Quiz
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                variants={staggerItem}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleQuizClick(quiz.id, quiz.status)}
                className="cursor-pointer bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white text-xl font-semibold font-['PP_Object_Sans'] flex-1 pr-2">
                    {quiz.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(
                      quiz.status
                    )}`}
                  >
                    {quiz.status === 'in-progress' ? 'Active' : 'Completed'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-white/50 text-sm font-['PP_Object_Sans']">
                  <span>{quiz.questions.length} questions</span>
                  <span>•</span>
                  <span>
                    Created {new Date(quiz.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {quiz.deadline && (
                  <div className="mt-2 text-white/40 text-xs font-['PP_Object_Sans']">
                    Deadline: {new Date(quiz.deadline).toLocaleString()}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
