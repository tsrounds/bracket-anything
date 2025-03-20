'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuth } from '../../components/UserAuth';
import styles from './quiz.module.css';
import buttonStyles from './button.module.css';

interface Quiz {
  id: string;
  title: string;
  deadline: string;
  status: 'in-progress' | 'completed';
  coverImage?: string;
  questions: {
    id: string;
    text: string;
    type: 'multiple' | 'open';
    points: number;
    options?: string[];
  }[];
}

export default function QuizLandingPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const { user } = useAuth();

  useEffect(() => {
    const fetchQuizAndRegistration = async () => {
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
        if (quizDoc.exists()) {
          const quizData = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
          console.log('Quiz data fetched:', quizData);
          setQuiz(quizData);
          
          // If quiz is completed, redirect to a message page
          if (quizData.status === 'completed') {
            console.log('Quiz is completed, redirecting to thank-you page');
            router.push(`/quiz/${quizId}/thank-you`);
            return;
          }

          // Check if user is already registered
          if (user) {
            const registrationRef = doc(db, 'quizRegistrations', `${quizId}_${user.uid}`);
            const registrationDoc = await getDoc(registrationRef);
            const isUserRegistered = registrationDoc.exists();
            setIsRegistered(isUserRegistered);
            
            // If user is not registered, redirect directly to registration page
            if (!isUserRegistered) {
              router.push(`/quiz/${quizId}/register`);
            }
          }
        } else {
          console.error('Quiz not found');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndRegistration();
  }, [quizId, router, user]);

  useEffect(() => {
    if (!quiz?.deadline) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(quiz.deadline).getTime();
      const distance = deadlineTime - now;

      if (distance < 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [quiz?.deadline]);

  const handleStartQuiz = () => {
    if (quiz?.status === 'completed') {
      return;
    }
    if (isRegistered) {
      router.push(`/quiz/${quizId}/take`);
    } else {
      router.push(`/quiz/${quizId}/register`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className={`${styles['quiz-container']} w-96 h-[821px] relative overflow-hidden rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border border-gray-200`}>
        {/* Background Image */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#E6D5C9] to-[#A1C4DD]" />

        {/* Content Container */}
        <div className="relative z-10">
          {/* Cover Image */}
          <div className={`${styles['quiz-cover']} p-3 pb-[18px]`}>
            <img
              src={quiz.coverImage || "https://placehold.co/316x202"}
              alt={quiz.title}
              className="w-full h-52 rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.30)] object-cover"
            />
          </div>

          {/* Quiz Title */}
          <div className="w-64 mx-auto text-center mt-6">
            <h1 className={`${styles['quiz-title']} font-['PP Object Sans Bold'] text-black`}>
              {quiz.title}
            </h1>
          </div>

          {/* Deadline Section - Moved up */}
          <div className="mt-12 text-center">
            <h2 className="text-base font-['PP Object Sans'] text-black mb-4">Deadline</h2>
            <div className="w-72 h-16 mx-auto bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <span className={`${styles['quiz-deadline']} text-2xl font-['PP Object Sans Bold'] text-black`}>
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Start Quiz Button - Additional spacing (mt-8 instead of mt-4) */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleStartQuiz}
              className={buttonStyles['animated-button']}
            >
              <div className={buttonStyles['button-content']}>
                <span className="text-white text-base font-['PP Object Sans']">
                  {isRegistered ? 'Continue Quiz' : 'Start Quiz'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 