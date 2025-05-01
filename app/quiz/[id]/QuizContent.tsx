'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
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

interface QuizContentProps {
  initialQuizData: Quiz | null;
}

export default function QuizContent({ initialQuizData }: QuizContentProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(initialQuizData);
  const [loading, setLoading] = useState(!initialQuizData);
  const [isRegistered, setIsRegistered] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const { user } = useAuth();

  useEffect(() => {
    const checkRegistration = async () => {
      if (!user || !quiz) return;

      try {
        const registrationRef = doc(db as unknown as Parameters<typeof doc>[0], 'quizRegistrations', `${quizId}_${user.uid}`);
        const registrationDoc = await getDoc(registrationRef);
        const isUserRegistered = registrationDoc.exists();
        setIsRegistered(isUserRegistered);
        
        // If user is not registered, redirect directly to registration page
        if (!isUserRegistered) {
          router.push(`/quiz/${quizId}/register`);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
      }
    };

    checkRegistration();
  }, [quizId, router, user, quiz]);

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

  const handleStartQuiz = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (quiz?.status === 'completed' || isPending) {
      return;
    }

    const nextRoute = isRegistered ? `/quiz/${quizId}/take` : `/quiz/${quizId}/register`;
    
    // Start the transition
    startTransition(() => {
      // Prefetch and prepare the route
      router.prefetch(nextRoute);
      
      // Use requestAnimationFrame to ensure we're in the next paint cycle
      requestAnimationFrame(() => {
        // Navigate after a frame has been painted
        router.push(nextRoute);
      });
    });
  }, [quiz?.status, isPending, isRegistered, quizId, router]);

  if (loading) {
    return (
      <div className={styles['quiz-container']}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className={styles['quiz-container']}>
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
          <p>The quiz you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['quiz-container']}>
      <div 
        className={`${styles['quiz-content']} ${isPending ? styles['fade-out'] : styles['fade-in']}`}
      >
        <div className={styles['quiz-title']}>
          {quiz.title}
        </div>

        <div className={styles['quiz-header']}>
          <div className={styles['quiz-cover']}>
            <img
              src={quiz.coverImage || "https://placehold.co/316x202"}
              alt={quiz.title}
            />
          </div>
        </div>

        <div className={styles['quiz-deadline']}>
          {timeLeft}
        </div>

        <button
          onClick={handleStartQuiz}
          className={buttonStyles['animated-button']}
          disabled={quiz?.status === 'completed' || isPending}
        >
          <div className={buttonStyles['button-content']}>
            <span>
              {isRegistered ? 'Continue Quiz' : 'Start Quiz'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
} 