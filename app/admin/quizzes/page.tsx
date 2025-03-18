'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase/firebase-client';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import AnswerSelectionModal from '../../components/AnswerSelectionModal';

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
  correctAnswers?: Record<string, string>;
  completedAt?: string;
}

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Quizzes component mounted:', {
      hasDb: !!db,
      isClient: typeof window !== 'undefined'
    });

    const fetchQuizzes = async () => {
      try {
        console.log('Starting to fetch quizzes');
        if (!db) {
          throw new Error('Firebase db is not initialized');
        }

        const quizzesQuery = query(
          collection(db, 'quizzes'),
          orderBy('createdAt', 'desc')
        );
        
        console.log('Created query, fetching docs...');
        const querySnapshot = await getDocs(quizzesQuery);
        const quizzesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Quiz[];

        console.log('Successfully fetched quizzes:', {
          count: quizzesList.length,
          firstQuiz: quizzesList[0]?.id
        });
        setQuizzes(quizzesList);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleStatusChange = async (quizId: string, currentStatus: 'in-progress' | 'completed') => {
    try {
      setUpdating(quizId);
      const quizRef = doc(db, 'quizzes', quizId);
      const newStatus = currentStatus === 'in-progress' ? 'completed' : 'in-progress';
      
      console.log('Updating quiz status in Firebase:', {
        quizId,
        currentStatus,
        newStatus
      });
      
      await updateDoc(quizRef, {
        status: newStatus
      });
      
      console.log('Successfully updated quiz status in Firebase');
      
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

  const handleAnswerSubmit = async (answers: Record<string, string>) => {
    if (!selectedQuiz) return;

    try {
      setUpdating(selectedQuiz.id);
      const quizRef = doc(db, 'quizzes', selectedQuiz.id);
      
      console.log('Submitting answers for quiz:', {
        quizId: selectedQuiz.id,
        quizTitle: selectedQuiz.title,
        answers
      });
      
      await updateDoc(quizRef, {
        status: 'completed',
        correctAnswers: answers,
        completedAt: new Date().toISOString()
      });
      
      console.log('Successfully stored answers in Firebase');
      
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
      console.error('Error updating quiz with answers:', error);
      alert('Failed to complete quiz');
    } finally {
      setUpdating(null);
    }
  };

  const handleShare = async (quizId: string) => {
    try {
      // Get the current URL and construct the quiz URL
      const baseUrl = window.location.origin;
      const quizUrl = `${baseUrl}/quiz/${quizId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(quizUrl);
      
      // Show feedback
      setCopiedQuizId(quizId);
      setTimeout(() => setCopiedQuizId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy URL to clipboard');
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
          href="/admin/create-quiz"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Quiz
        </Link>
      </div>

      {loading ? (
        <div className="text-center">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
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
                              {copiedQuizId === quiz.id ? 'Copied!' : 'Share Quiz'}
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
                              {copiedQuizId === quiz.id ? 'Copied!' : 'Share Quiz'}
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
        <AnswerSelectionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onComplete={handleAnswerSubmit}
          questions={selectedQuiz.questions}
          quizTitle={selectedQuiz.title}
        />
      )}
    </div>
  );
}