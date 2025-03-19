'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuth } from '../../components/UserAuth';

interface Quiz {
  id: string;
  title: string;
  deadline: string;
  status: 'in-progress' | 'completed';
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
          setQuiz(quizData);
          
          // If quiz is completed, redirect to a message page
          if (quizData.status === 'completed') {
            router.push(`/quiz/${quizId}/completed`);
            return;
          }

          // Check if user is already registered
          if (user) {
            const registrationRef = doc(db, 'quizRegistrations', `${quizId}_${user.uid}`);
            const registrationDoc = await getDoc(registrationRef);
            setIsRegistered(registrationDoc.exists());
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{quiz.title}</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Details</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  <span className="font-medium">Questions:</span> {quiz.questions.length}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Deadline:</span>{' '}
                  {new Date(quiz.deadline).toLocaleString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Total Points:</span>{' '}
                  {quiz.questions.reduce((sum, q) => sum + q.points, 0)}
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleStartQuiz}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                {isRegistered ? 'Continue Quiz' : 'Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 