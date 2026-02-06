'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../components/UserAuth';
import { db } from '../../lib/firebase/firebase-client';
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc, documentId } from 'firebase/firestore';
import UserInfoBadge from '../../components/predict-this/UserInfoBadge';
import AvatarSelector from '../../components/AvatarSelector';
import { Quiz } from '../../lib/predict-this/types';
import { staggerContainer, staggerItem } from '../../../lib/motion';
import { getLinkedUserIds, getStoredCreatorUids, getMyQuizIds } from '../../lib/deviceFingerprint';

export default function MyQuizzes() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined);
  const [userPhone, setUserPhone] = useState('');
  const [loading, setLoading] = useState(true);

  // Profile edit modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        router.push('/predict-this/register');
        return;
      }

      try {
        // Fetch user profile
        const profileRef = doc(db as any, 'userProfiles', user.uid);
        const profileDoc = await getDoc(profileRef);

        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          setUserName(profileData.name || 'User');
          setUserAvatar(profileData.avatar);
          setUserPhone(profileData.phoneNumber || '');
        }

        // PRIMARY METHOD: Get quiz IDs directly from localStorage
        // This is the most reliable method - doesn't depend on UID matching
        const myQuizIds = getMyQuizIds();
        console.log('[MyQuizzes] Quiz IDs from localStorage:', myQuizIds);

        let quizzesList: Quiz[] = [];

        // Fetch quizzes by their IDs directly
        if (myQuizIds.length > 0) {
          const idsToQuery = myQuizIds.slice(0, 30);  // Firestore 'in' limit
          const quizIdQuery = query(
            collection(db as any, 'quizzes'),
            where(documentId(), 'in', idsToQuery)
          );
          const idSnapshot = await getDocs(quizIdQuery);
          quizzesList = idSnapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          })) as Quiz[];
          console.log('[MyQuizzes] Found by quiz IDs:', quizzesList.length);
        }

        // FALLBACK: Also try UID-based query for backwards compatibility
        // This catches quizzes created before the quiz ID storage was added
        const linkedUserIds = await getLinkedUserIds();
        const storedUids = getStoredCreatorUids();
        const allUids = [...new Set([...linkedUserIds, ...storedUids, user.uid])];
        console.log('[MyQuizzes] UIDs for fallback query:', allUids);

        if (allUids.length > 0) {
          const uidsToQuery = allUids.slice(0, 30);
          const uidQuery = query(
            collection(db as any, 'quizzes'),
            where('creatorId', 'in', uidsToQuery)
          );
          const uidSnapshot = await getDocs(uidQuery);
          const uidQuizzes = uidSnapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          })) as Quiz[];
          console.log('[MyQuizzes] Found by UIDs:', uidQuizzes.length);

          // Merge and deduplicate
          const existingIds = new Set(quizzesList.map(q => q.id));
          for (const quiz of uidQuizzes) {
            if (!existingIds.has(quiz.id)) {
              quizzesList.push(quiz);
            }
          }
        }

        // Sort by createdAt descending
        quizzesList.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        console.log('[MyQuizzes] Total quizzes found:', quizzesList.length);

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

  const openProfileModal = () => {
    setEditName(userName);
    setEditPhone(formatPhoneNumber(userPhone));
    setEditAvatar(userAvatar);
    setShowProfileModal(true);
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formattedNumber = '';
    if (digits.length > 0) {
      formattedNumber = '(' + digits.substring(0, 3);
      if (digits.length > 3) {
        formattedNumber += ') ' + digits.substring(3, 6);
        if (digits.length > 6) {
          formattedNumber += '-' + digits.substring(6, 10);
        }
      }
    }
    return formattedNumber;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, '');
    if (digits.length <= 10) {
      setEditPhone(formatPhoneNumber(digits));
    }
  };

  const handleAvatarSelect = (avatarPath: string) => {
    setEditAvatar(avatarPath);
  };

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;

    setSaving(true);
    try {
      const profileRef = doc(db as any, 'userProfiles', user.uid);
      const existingProfile = await getDoc(profileRef);

      await setDoc(profileRef, {
        ...(existingProfile.exists() ? existingProfile.data() : {}),
        name: editName.trim(),
        avatar: editAvatar,
        phoneNumber: editPhone.replace(/\D/g, ''),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Update local state
      setUserName(editName.trim());
      setUserAvatar(editAvatar);
      setUserPhone(editPhone.replace(/\D/g, ''));
      setShowProfileModal(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
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
      {/* User Info Badge - Clickable */}
      <button
        onClick={openProfileModal}
        className="absolute top-4 right-4 md:top-8 md:right-8 hover:opacity-80 transition-opacity cursor-pointer"
      >
        <UserInfoBadge
          name={userName}
          avatar={userAvatar}
        />
      </button>

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

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white font-['PP_Object_Sans']">
                Edit Profile
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Avatar Section */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-3 font-['PP_Object_Sans']">
                Avatar
              </label>
              <AvatarSelector
                onAvatarSelect={handleAvatarSelect}
                initialAvatar={editAvatar}
              />
            </div>

            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2 font-['PP_Object_Sans']">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all font-['PP_Object_Sans']"
              />
            </div>

            {/* Phone Number Input */}
            <div className="mb-8">
              <label className="block text-white/80 text-sm mb-2 font-['PP_Object_Sans']">
                Phone Number <span className="text-white/40">(optional)</span>
              </label>
              <input
                type="tel"
                value={editPhone}
                onChange={handlePhoneChange}
                placeholder="(XXX) XXX-XXXX"
                maxLength={14}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all font-['PP_Object_Sans']"
              />
              <p className="text-white/40 text-xs mt-2 font-['PP_Object_Sans']">
                Add your phone to access your account from any device
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowProfileModal(false)}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-slate-800 border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-slate-700 transition-all font-['PP_Object_Sans'] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !editName.trim()}
                className="flex-1 px-6 py-3 bg-cyan-400 rounded-lg text-slate-900 font-semibold hover:bg-cyan-300 transition-all font-['PP_Object_Sans'] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
