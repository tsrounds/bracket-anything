'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../../lib/firebase/firebase-client';
import firebase from 'firebase/compat/app';
import { doc, getDoc, setDoc, collection, arrayUnion, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../../../components/UserAuth';
import UserAuth from '../../../../components/UserAuth';
import styles from './quiz.module.css';
import AnimatedButton from '../../../../components/AnimatedButton';
import QuickRegistrationModal, { QuickRegistrationData } from '../../../../components/QuickRegistrationModal';
import { hasDeviceSubmittedQuiz, getDeviceFingerprint, hashFingerprint, recordDeviceFingerprint } from '../../../../lib/deviceFingerprint';

interface Question {
  id: string;
  type: 'multiple' | 'open';
  text: string;
  options?: string[];
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  questions: Question[];
  status: 'active' | 'completed';
}

type Props = {
  params: {
    id: string;
  };
}

export default function TakeQuiz({ params }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const [fadeOut, setFadeOut] = useState(false);
  const [hasGoneBack, setHasGoneBack] = useState(false);
  const [showQuickReg, setShowQuickReg] = useState(false);

  useEffect(() => {
    const fetchQuizAndCheckSubmission = async () => {
      if (!db) {
        console.error('Firestore instance not initialized');
        return;
      }

      try {
        // Fetch quiz data
        const quizRef = doc(db as unknown as Parameters<typeof doc>[0], 'quizzes', params.id);
        const quizDoc = await getDoc(quizRef);
        if (quizDoc.exists()) {
          setQuiz({ id: quizDoc.id, ...quizDoc.data() } as Quiz);
        }

        // Check device fingerprint for duplicate submissions
        if (typeof window !== 'undefined') {
          const hasTaken = await hasDeviceSubmittedQuiz(params.id);
          if (hasTaken) {
            console.log('[TakeQuiz] Device has already submitted this quiz');
            router.push(`/bracket/quiz/${params.id}/thank-you`);
            return;
          }
        }

        // Check for existing submission by user UID if user is logged in
        if (user) {
          const submissionRef = doc(db as unknown as Parameters<typeof doc>[0], 'submissions', `${params.id}_${user.uid}`);
          const submissionDoc = await getDoc(submissionRef);

          if (submissionDoc.exists()) {
            // User has already submitted, redirect to thank you page
            console.log('[TakeQuiz] User has already submitted this quiz');
            router.push(`/bracket/quiz/${params.id}/thank-you?resubmit=true`);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchQuizAndCheckSubmission();
    }
  }, [params.id, user, router, authLoading]);

  const handleQuizComplete = () => {
    // Show quick registration modal instead of immediate submit
    setShowQuickReg(true);
  };

  const handleQuickRegSubmit = async (data: QuickRegistrationData) => {
    setSubmitting(true);

    if (!db) {
      console.error('Firestore instance not initialized');
      alert('Failed to submit quiz. Please try again.');
      setSubmitting(false);
      return;
    }

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get device fingerprint and hash it
      const fingerprint = await getDeviceFingerprint();
      const fingerprintHash = await hashFingerprint(fingerprint);

      // Determine account type based on phone number
      const accountType: 'anonymous' | 'permanent' = data.phoneNumber ? 'permanent' : 'anonymous';

      // Create/update user profile
      const userProfileRef = doc(db as unknown as Parameters<typeof doc>[0], 'userProfiles', user.uid);
      const userProfileData: any = {
        name: data.name,
        avatar: data.avatar || null,
        phoneNumber: data.phoneNumber || '',
        accountType,
        deviceFingerprints: arrayUnion(fingerprintHash),
        updatedAt: new Date().toISOString(),
      };

      // Add createdAt only if it's a new profile
      const existingProfile = await getDoc(userProfileRef);
      if (!existingProfile.exists()) {
        userProfileData.createdAt = Timestamp.now();
      }

      await setDoc(userProfileRef, userProfileData, { merge: true });

      // Record device fingerprint with quiz submission
      await recordDeviceFingerprint(user.uid, params.id);

      // Create quiz registration
      const quizRegRef = doc(db as unknown as Parameters<typeof doc>[0], 'quizRegistrations', `${params.id}_${user.uid}`);
      await setDoc(quizRegRef, {
        userId: user.uid,
        name: data.name,
        phoneNumber: data.phoneNumber || '',
        avatar: data.avatar || null,
        quizId: params.id,
        createdAt: new Date().toISOString(),
        deviceFingerprint: fingerprintHash,
      });

      // Create submission document
      const submissionRef = doc(db as unknown as Parameters<typeof doc>[0], 'submissions', `${params.id}_${user.uid}`);
      const submissionData = {
        userId: user.uid,
        userName: data.name,
        quizId: params.id,
        answers,
        submittedAt: new Date().toISOString(),
        totalQuestions: quiz?.questions.length || 0,
        totalAnswered: Object.keys(answers).length,
        deviceFingerprint: fingerprintHash,
      };

      await setDoc(submissionRef, submissionData);

      // Store in session storage for backward compatibility
      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('userName', data.name);
      sessionStorage.setItem('quizId', params.id);

      // Redirect to thank you page
      router.push(`/bracket/quiz/${params.id}/thank-you`);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const handleQuickRegCancel = () => {
    setShowQuickReg(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Remove the UserAuth check - users are auto-signed in anonymously now

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h1>
          <p className="text-gray-600">The quiz you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  // Guard against undefined currentQuestion
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">No Questions Found</h1>
          <p className="text-white/60">This quiz doesn't have any questions yet.</p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setFadeOut(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setFadeOut(false);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setHasGoneBack(true);
      setFadeOut(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setFadeOut(false);
      }, 300);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string, isOpenEnded: boolean = false) => {
    console.log('Answer selected:', answer);
    setSelectedAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Only auto-advance for multiple choice questions, not open-ended
    if (!isOpenEnded && currentQuestionIndex < quiz.questions.length - 1) {
      setTimeout(() => {
        console.log('Moving to next question');
        setSelectedAnswer(null);
        handleNext();
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-96 relative bg-slate-900 overflow-hidden p-6">
        {/* Fixed Header Section */}
        <div className="h-[160px] flex flex-col">
          {/* Quiz Title - fixed height */}
          <div className="h-[24px] text-white/50 text-sm font-['PP_Object_Sans']">
            {quiz.title}
          </div>

          {/* Question Number - fixed height */}
          <div className="h-[48px] mt-4 text-white text-3xl font-extrabold font-['PP_Object_Sans']">
            Question {currentQuestionIndex + 1}
          </div>

          {/* Progress Tracker - fixed height */}
          <div className="h-[24px] mt-4 flex gap-2">
            {quiz.questions.map((_, index) => (
              <div
                key={index}
                className={`w-4 h-[3px] rounded-[10px] ${
                  index < currentQuestionIndex
                    ? 'bg-[#acc676]'
                    : index === currentQuestionIndex
                    ? 'bg-cyan-400'
                    : 'bg-zinc-300 bg-opacity-20'
                }`}
              />
            ))}
          </div>

          {/* Question Text - fixed height */}
          <div className={`h-[64px] mt-8 text-white text-2xl font-normal font-['PP_Object_Sans'] text-center transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            {currentQuestion.text}
          </div>
        </div>

        {/* Scrollable Content Section */}
        <div className="mt-16">
          {/* Answer Options or Text Input */}
          <div className="space-y-4">
            {currentQuestion.type === 'open' ? (
              /* Open-ended question - show text input */
              <div className="w-full space-y-4">
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value, true)}
                  placeholder="Type your prediction here..."
                  className="w-full h-12 px-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 font-['PP_Object_Sans'] focus:outline-none focus:border-[#acc676]"
                />
                {/* Next button for open-ended questions */}
                <AnimatedButton
                  onClick={() => {
                    if (currentQuestionIndex < totalQuestions - 1) {
                      handleNext();
                    } else {
                      handleQuizComplete();
                    }
                  }}
                  disabled={!answers[currentQuestion.id]?.trim()}
                  className={`w-full h-12 rounded-lg transition-all duration-300 ${
                    answers[currentQuestion.id]?.trim()
                      ? 'bg-[#acc676] text-white'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  <span className="font-['PP_Object_Sans'] font-semibold">
                    {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Submit Quiz'}
                  </span>
                </AnimatedButton>
              </div>
            ) : (
              /* Multiple choice - show options */
              currentQuestion.options?.map((option) => {
                const isSelected = answers[currentQuestion.id] === option;

                return (
                  <AnimatedButton
                    key={option}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                    className={`w-full h-12 relative rounded-lg transition-all duration-300 group
                      ${isSelected
                        ? 'bg-[#acc676] border-none'
                        : 'bg-transparent border border-white hover:opacity-80'}`}
                  >
                    <div className="flex items-center justify-between px-6">
                      <span className={`text-base font-normal font-['PP_Object_Sans'] ${isSelected ? 'text-white' : 'text-white'}`}>
                        {option}
                      </span>
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </AnimatedButton>
                );
              })
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            {/* Previous Button */}
            <AnimatedButton
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`p-2 rounded-lg transition-all duration-300 ${
                currentQuestionIndex === 0 
                  ? 'opacity-0 pointer-events-none' 
                  : 'text-cyan-400 hover:bg-cyan-400/10'
              }`}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </AnimatedButton>

            {/* Submit Button (only show on last question) */}
            {currentQuestionIndex === totalQuestions - 1 ? (
              <AnimatedButton
                onClick={handleQuizComplete}
                disabled={submitting}
                className="w-48 h-12 relative rounded-lg bg-[#F58143] text-white hover:opacity-90 disabled:opacity-50 transition-all duration-300 font-['PP_Object_Sans']"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </AnimatedButton>
            ) : (
              /* Next Button (show when not on last question and we've gone back) */
              hasGoneBack && (
                <AnimatedButton
                  onClick={handleNext}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    Object.keys(answers).includes(currentQuestion.id)
                      ? 'text-cyan-400 hover:bg-cyan-400/10'
                      : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </AnimatedButton>
              )
            )}
          </div>
        </div>
      </div>

      {/* Quick Registration Modal */}
      <QuickRegistrationModal
        isOpen={showQuickReg}
        onSubmit={handleQuickRegSubmit}
        onCancel={handleQuickRegCancel}
        loading={submitting}
      />
    </div>
  );
} 