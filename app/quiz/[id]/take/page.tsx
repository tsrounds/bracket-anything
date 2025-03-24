'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../lib/firebase/firebase-client';
import firebase from 'firebase/compat/app';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { useAuth } from '../../../components/UserAuth';
import UserAuth from '../../../components/UserAuth';
import styles from './quiz.module.css';

interface Question {
  id: string;
  text: string;
  options: string[];
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

        // Check for existing submission if user is logged in
        if (user) {
          const submissionRef = doc(db as unknown as Parameters<typeof doc>[0], 'submissions', `${params.id}_${user.uid}`);
          const submissionDoc = await getDoc(submissionRef);
          
          if (submissionDoc.exists()) {
            // User has already submitted, redirect to thank you page
            router.push(`/quiz/${params.id}/thank-you?resubmit=true`);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndCheckSubmission();
  }, [params.id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Get user profile
      const userProfileRef = doc(db as unknown as Parameters<typeof doc>[0], 'userProfiles', user.uid);
      const userProfileDoc = await getDoc(userProfileRef);
      if (!userProfileDoc.exists()) {
        throw new Error('User profile not found');
      }
      const userProfile = userProfileDoc.data();

      // Create submission document with unique ID
      const submissionRef = doc(db as unknown as Parameters<typeof doc>[0], 'submissions', `${params.id}_${user.uid}`);
      const submissionData = {
        userId: user.uid,
        userName: userProfile.name,
        quizId: params.id,
        answers,
        submittedAt: new Date().toISOString(),
        totalQuestions: quiz?.questions.length || 0,
        totalAnswered: Object.keys(answers).length,
      };

      await setDoc(submissionRef, submissionData);

      // Redirect to thank you page
      router.push(`/quiz/${params.id}/thank-you`);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <UserAuth />;
  }

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
      setFadeOut(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setFadeOut(false);
      }, 300);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    console.log('Answer selected:', answer);
    setSelectedAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Automatically move to next question after a longer delay to show checkmark
    if (currentQuestionIndex < quiz.questions.length - 1) {
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
        {/* Quiz Title */}
        <div className="text-white/50 text-sm font-['PP_Object_Sans']">
          {quiz.title}
        </div>

        {/* Question Number */}
        <div className="mt-4 text-white text-3xl font-extrabold font-['PP_Object_Sans']">
          Question {currentQuestionIndex + 1}
        </div>

        {/* Progress Tracker */}
        <div className="mt-4 flex gap-2">
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

        {/* Question Text */}
        <div className={`mt-8 text-white text-2xl font-normal font-['PP_Object_Sans'] text-center transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
          {currentQuestion.text}
        </div>

        {/* Answer Options */}
        <div className="mt-16 space-y-4">
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option;
            
            return (
              <button
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
                    {isSelected ? (
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
                            strokeWidth={3} 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-[2.46px] border-white" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {currentQuestionIndex === totalQuestions - 1 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length !== totalQuestions}
                className="w-48 h-12 relative rounded-lg bg-[#F58143] text-white hover:opacity-90 disabled:opacity-50 transition-all duration-300 font-['PP_Object_Sans']"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 