import { Suspense } from 'react';
import { db } from '../../../lib/firebase/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

interface Quiz {
  id: string;
  title: string;
  status: 'in-progress' | 'completed';
  completedAt?: string;
}

type Props = {
  params: {
    id: string;
  };
}

async function QuizContent({ id }: { id: string }) {
  console.log('QuizContent received id:', id);
  console.log('QuizContent is async:', Object.getPrototypeOf(QuizContent).constructor.name);
  
  const quizDoc = await getDoc(doc(db, 'quizzes', id));
  
  if (!quizDoc.exists()) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h1>
        <p className="text-gray-600">The quiz you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const quiz = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
  console.log('Quiz data:', quiz);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="mb-6">
        <svg
          className="mx-auto h-12 w-12 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Quiz Completed
      </h1>

      <p className="text-gray-600 mb-6">
        The quiz "{quiz.title}" has been completed and is no longer accepting submissions.
        {quiz.completedAt && (
          <span className="block mt-2 text-sm">
            Completed on: {new Date(quiz.completedAt).toLocaleString()}
          </span>
        )}
      </p>

      <div className="space-y-4">
        <Link
          href={`/quiz/${id}/thank-you`}
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          View Results
        </Link>

        <div>
          <Link
            href="/"
            className="inline-block text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function CompletedQuizPage({ params }: Props) {
  console.log('CompletedQuizPage received params:', params);
  console.log('CompletedQuizPage is async:', Object.getPrototypeOf(CompletedQuizPage).constructor.name);
  console.log('Params type:', typeof params);
  console.log('Params id type:', typeof params.id);
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Suspense fallback={
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        }>
          <QuizContent id={params.id} />
        </Suspense>
      </div>
    </div>
  );
} 