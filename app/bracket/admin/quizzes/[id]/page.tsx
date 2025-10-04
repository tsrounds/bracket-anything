'use client';

import { useEffect, useState } from 'react';
import { db } from '../../../../lib/firebase/firebase-client';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import AuthCheck from '../../../../components/AuthCheck';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  type: 'multiple' | 'open';
  points: number;
  options?: string[];
}

interface Quiz {
  id: string;
  title: string;
  deadline: string;
  status: 'in-progress' | 'completed';
  coverImage?: string;
  questions: Question[];
  correctAnswers?: Record<string, string>;
  completedAt?: string;
}

interface Submission {
  id: string;
  userId: string;
  userName: string;
  quizId: string;
  answers: Record<string, string>;
  submittedAt: string;
  totalQuestions: number;
  totalAnswered: number;
  score?: number;
}

export default function QuizDetailsPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const quizId = params.id as string;

  useEffect(() => {
    const fetchQuizAndSubmissions = async () => {
      if (!db) {
        console.error('Firebase database not initialized');
        setLoading(false);
        return;
      }

      try {
        // Fetch quiz data
        const quizRef = doc(db as unknown as Parameters<typeof doc>[0], 'quizzes', quizId);
        const quizDoc = await getDoc(quizRef);
        if (quizDoc.exists()) {
          const quizData = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
          setQuiz(quizData);

          // Fetch all submissions for this quiz
          const submissionsRef = collection(db as unknown as Parameters<typeof doc>[0], 'submissions');
          const submissionsQuery = query(
            submissionsRef,
            where('quizId', '==', quizId)
          );
          const submissionsSnapshot = await getDocs(submissionsQuery);
          const allSubmissions = submissionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Submission[];

          // Calculate scores for completed quizzes
          if (quizData.status === 'completed' && quizData.correctAnswers) {
            allSubmissions.forEach(submission => {
              let score = 0;
              Object.entries(submission.answers).forEach(([questionId, answer]) => {
                if (answer === quizData.correctAnswers?.[questionId]) {
                  const question = quizData.questions.find(q => q.id === questionId);
                  if (question) {
                    score += question.points;
                  }
                }
              });
              submission.score = score;
            });
          }

          // Sort submissions by score (if completed) or submission time
          const sortedSubmissions = allSubmissions.sort((a, b) => {
            if (a.score !== undefined && b.score !== undefined) {
              return b.score - a.score;
            }
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
          });

          setSubmissions(sortedSubmissions);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndSubmissions();
  }, [quizId]);

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

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <AuthCheck>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link
            href="/admin/quizzes"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to Quizzes
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                quiz.status === 'completed' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {quiz.status === 'completed' ? 'Completed' : 'In Progress'}
              </span>
              <span className="text-sm text-gray-500">
                Deadline: {new Date(quiz.deadline).toLocaleString()}
              </span>
              {quiz.completedAt && (
                <span className="text-sm text-gray-500">
                  Completed: {new Date(quiz.completedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {quiz.questions.map((question, index) => (
                <li key={question.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <h3 className="text-lg font-medium text-gray-900">{question.text}</h3>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {question.points} points
                        </span>
                      </div>
                      {question.options && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Options:</p>
                          <ul className="mt-1 space-y-1">
                            {question.options.map((option, i) => (
                              <li key={i} className="text-sm text-gray-600">
                                {option}
                                {quiz.status === 'completed' && option === quiz.correctAnswers?.[question.id] && (
                                  <span className="ml-2 text-green-600">✓</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Submissions Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">Submissions</h2>
            <p className="mt-1 text-sm text-gray-500">
              {submissions.length} total submissions
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {submissions.map((submission, index) => (
                <li key={submission.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <h3 className="text-lg font-medium text-gray-900">{submission.userName}</h3>
                        {quiz.status === 'completed' && submission.score !== undefined && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {submission.score}/{totalPoints} points
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
} 