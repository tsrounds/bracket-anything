'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../components/UserAuth';
import { db } from '../../lib/firebase/firebase-client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import UserInfoBadge from '../../components/predict-this/UserInfoBadge';
import AvatarSelector from '../../components/AvatarSelector';
import { staggerContainer, staggerItem } from '../../../lib/motion';

export default function PredictThisMenu() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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
          setUserPhone(profileData.phoneNumber || '');
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
