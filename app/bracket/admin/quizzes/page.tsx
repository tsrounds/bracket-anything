'use client';

import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase/firebase-client';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  where, 
  DocumentData, 
  QueryDocumentSnapshot,
  DocumentReference
} from 'firebase/firestore';
import Link from 'next/link';
import CompleteQuizModal from '../../../components/quiz/CompleteQuizModal';
import { useAuthReady } from '../../../lib/hooks/useAuthReady';

interface Question {
  id: string;
  type: 'multiple' | 'open';
  text: string;
  points: number;
  options?: string[];
}

interface Quiz {
  id: string;
  title: string;
  deadline: string;
  createdAt: string;
  status: 'in-progress' | 'completed';
  questions: Question[];
  correctAnswers?: Record<string, string | string[]>;
  completedAt?: string;
  coverImage?: string;
}

interface Submission {
  userId: string;
  userName: string;
  answers: Record<string, string>;
}

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthReady();

  useEffect(() => {
    console.log('Quizzes component mounted:', {
      hasDb: !!db,
      isClient: typeof window !== 'undefined'
    });

    const fetchQuizzes = async () => {
      try {
        console.log('Starting to fetch quizzes');
        if (typeof window === 'undefined') {
          throw new Error('Cannot fetch quizzes on server side');
        }

        if (!db) {
          throw new Error('Firestore database not initialized');
        }

        const quizzesRef = collection(db, 'quizzes');
        const q = query(quizzesRef, orderBy('createdAt', 'desc'));
        console.log('Created query, fetching docs...');
        const querySnapshot = await getDocs(q);
        if (!querySnapshot || !querySnapshot.docs) {
          console.error('Firestore query failed or returned no docs', { querySnapshot });
          setQuizzes([]);
          setError('No quizzes found or Firestore query failed.');
          return;
        }
        const quizzesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Quiz[];
        if (!Array.isArray(quizzesList)) {
          console.error('quizzesList is not an array:', quizzesList);
          setQuizzes([]);
          setError('Failed to load quizzes.');
          return;
        }
        console.log('Successfully fetched quizzes:', {
          count: quizzesList.length,
          firstQuiz: quizzesList[0]?.id
        });
        setQuizzes(quizzesList);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch quizzes');
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleStatusChange = async (quizId: string, currentStatus: 'in-progress' | 'completed') => {
    try {
      setUpdating(quizId);
      const newStatus = currentStatus === 'in-progress' ? 'completed' : 'in-progress';

      console.log('Updating quiz status in Firebase:', { quizId, currentStatus, newStatus });

      const response = await fetch('/api/admin/quiz-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, newStatus }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to update quiz status');
      }

      console.log('Successfully updated quiz status');

      // Update local state
      setQuizzes(prevQuizzes =>
        prevQuizzes.map(quiz =>
          quiz.id === quizId ? { ...quiz, status: newStatus } : quiz
        )
      );
    } catch (error) {
      console.error('Error updating quiz status:', error);
      alert('Failed to update quiz status');
    } finally {
      setUpdating(null);
    }
  };

  const handleCompleteClick = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedQuiz(null);
  };

  const handleAnswerSubmit = async (answers: Record<string, string | string[]>) => {
    if (!selectedQuiz || typeof window === 'undefined') return;

    try {
      setUpdating(selectedQuiz.id);

      console.log('Submitting answers for quiz:', {
        quizId: selectedQuiz.id,
        quizTitle: selectedQuiz.title,
        answers
      });

      const response = await fetch('/api/admin/quiz-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: selectedQuiz.id,
          answers,
          questions: selectedQuiz.questions,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to complete quiz');
      }

      console.log('Successfully completed quiz');

      // Update local state
      setQuizzes(prevQuizzes =>
        prevQuizzes.map(quiz =>
          quiz.id === selectedQuiz.id
            ? { ...quiz, status: 'completed', correctAnswers: answers }
            : quiz
        )
      );

      setIsModalOpen(false);
      setSelectedQuiz(null);
    } catch (error) {
      console.error('Error in handleAnswerSubmit:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete quiz');
    } finally {
      setUpdating(null);
    }
  };

  const handleShare = async (quizId: string) => {
    try {
      // For completed quizzes, navigate to the thank you page which shows the leaderboard
      const quiz = quizzes.find(q => q.id === quizId);
      if (quiz?.status === 'completed') {
        window.open(`/bracket/quiz/${quizId}/thank-you`, '_blank');
        return;
      }

      // For in-progress quizzes, keep the share functionality
      const baseUrl = window.location.origin;
      const quizUrl = `${baseUrl}/bracket/quiz/${quizId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(quizUrl);
      
      // Show feedback
      setCopiedQuizId(quizId);
      setTimeout(() => setCopiedQuizId(null), 2000);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to perform action');
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <h2 className="text-red-800 font-semibold">Error Loading Quizzes</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <Link
          href="/bracket/admin/create-quiz"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Quiz
        </Link>
      </div>

      {loading ? (
        <div className="text-center">Loading quizzes...</div>
      ) : !quizzes || quizzes.length === 0 ? (
        <div className="text-center text-gray-500">
          No quizzes created yet. Click "Create New Quiz" to get started.
        </div>
      ) : (
        <div className="space-y-8">
          {/* In Progress Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              In Progress Quizzes
            </h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {quizzes
                  .filter(quiz => quiz.status === 'in-progress')
                  .map((quiz) => (
                    <li key={quiz.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-medium text-indigo-600 truncate">
                                {quiz.title}
                              </h3>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                In Progress
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              Deadline: {new Date(quiz.deadline).toLocaleString()}
                            </p>
                          </div>
                          <div className="ml-4 flex items-center space-x-4">
                            <button
                              onClick={() => handleShare(quiz.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              {quiz.status === 'completed' ? 'Leaderboard' : (copiedQuizId === quiz.id ? 'Copied!' : 'Share Quiz')}
                            </button>
                            <button
                              onClick={() => handleCompleteClick(quiz)}
                              disabled={updating === quiz.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
                            >
                              {updating === quiz.id ? 'Updating...' : 'Complete'}
                            </button>
                            <Link
                              href={`/admin/quizzes/${quiz.id}`}
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Completed Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
              Completed Quizzes
            </h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {quizzes
                  .filter(quiz => quiz.status === 'completed')
                  .map((quiz) => (
                    <li key={quiz.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-medium text-indigo-600 truncate">
                                {quiz.title}
                              </h3>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                Completed
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              Deadline: {new Date(quiz.deadline).toLocaleString()}
                            </p>
                          </div>
                          <div className="ml-4 flex items-center space-x-4">
                            <button
                              onClick={() => handleShare(quiz.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              {quiz.status === 'completed' ? 'Leaderboard' : (copiedQuizId === quiz.id ? 'Copied!' : 'Share Quiz')}
                            </button>
                            <button
                              onClick={() => handleStatusChange(quiz.id, quiz.status)}
                              disabled={updating === quiz.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 disabled:bg-amber-400"
                            >
                              {updating === quiz.id ? 'Updating...' : 'Mark as In Progress'}
                            </button>
                            <Link
                              href={`/admin/quizzes/${quiz.id}`}
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {selectedQuiz && (
        <CompleteQuizModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onComplete={handleAnswerSubmit}
          questions={selectedQuiz.questions}
          quizTitle={selectedQuiz.title}
          quizId={selectedQuiz.id}
        />
      )}
    </div>
  );
}