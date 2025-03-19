'use client';

import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase/firebase-client';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/UserAuth';

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
  coverImage?: string;
  questions: Question[];
  correctAnswers?: Record<string, string>;
  status: 'in-progress' | 'completed';
}

interface Submission {
  id: string;
  userId: string;
  userName: string;
  quizId: string;
  answers: Record<string, string>;
  submittedAt: string;
  score?: number;
  totalQuestions?: number;
  totalAnswered?: number;
}

function ResultsModal({ 
  isOpen, 
  onClose, 
  submission, 
  quiz 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  submission: Submission; 
  quiz: Quiz;
}) {
  if (!isOpen) return null;

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Results for {submission.userName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Submitted on {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((question) => {
            const userAnswer = submission.answers[question.id];
            const correctAnswer = quiz.correctAnswers?.[question.id];
            const isCorrect = userAnswer === correctAnswer;

            return (
              <div 
                key={question.id} 
                className={`p-4 rounded-lg border ${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-gray-900 font-medium">{question.text}</h3>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isCorrect ? `+${question.points}` : '0'} points
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Answer: <span className="font-medium">{userAnswer}</span>
                  </p>
                  {quiz.status === 'completed' && (
                    <p className="text-gray-600">
                      Correct answer: <span className="font-medium">{correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [uniqueAnswer, setUniqueAnswer] = useState<{questionId: string, answer: string} | null>(null);
  const [universalAnswer, setUniversalAnswer] = useState<{questionId: string, answer: string} | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Start with fadeOut true and then set it to false after a short delay
    setFadeOut(true);
    const timer = setTimeout(() => {
      setFadeOut(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchQuizAndSubmissions = async () => {
      try {
        // Fetch quiz data
        const quizDoc = await getDoc(doc(db, 'quizzes', params.id));
        if (quizDoc.exists()) {
          const quizData = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
          setQuiz(quizData);

          // Fetch all submissions for this quiz
          const submissionsQuery = query(
            collection(db, 'submissions'),
            where('quizId', '==', params.id)
          );
          const submissionsSnapshot = await getDocs(submissionsQuery);
          const allSubmissions = submissionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Submission[];

          // Sort submissions by score (if completed) or submission time
          const sortedSubmissions = allSubmissions.sort((a, b) => {
            if (a.score !== undefined && b.score !== undefined) {
              return b.score - a.score;
            }
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
          });

          setSubmissions(sortedSubmissions);

          // Find user's submission using userId instead of userName
          if (user) {
            const userSub = sortedSubmissions.find(sub => sub.userId === user.uid);
            if (userSub) {
              setUserSubmission(userSub);
              
              // Analyze answers for unique and universal matches
              if (quizData.status === 'in-progress') {
                const userAnswers = userSub.answers;
                const otherSubmissions = sortedSubmissions.filter(sub => sub.id !== userSub.id);
                
                // Check for unique answers
                for (const [questionId, answer] of Object.entries(userAnswers)) {
                  const isUnique = !otherSubmissions.some(sub => sub.answers[questionId] === answer);
                  if (isUnique) {
                    setUniqueAnswer({ questionId, answer });
                    break;
                  }
                }
                
                // Check for universal answers
                for (const [questionId, answer] of Object.entries(userAnswers)) {
                  const isUniversal = otherSubmissions.every(sub => sub.answers[questionId] === answer);
                  if (isUniversal) {
                    setUniversalAnswer({ questionId, answer });
                    break;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndSubmissions();
  }, [params.id, user]);

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
  const userScore = userSubmission?.score;
  const userRank = userSubmission ? submissions.findIndex(s => s.userId === userSubmission.userId) + 1 : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className={`w-[320px] h-[688px] bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border border-gray-200 transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        {/* Quiz Cover Image */}
        <div className="p-3 pb-[18px]">
          <img 
            src={quiz.coverImage || "https://placehold.co/294x208"} 
            alt="Quiz cover"
            className="w-[294px] h-[208px] rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.30)] object-cover"
          />
        </div>

        {/* Content */}
        <div className="px-3">
          <div className="text-center mb-6">
            <h1 className="text-xl font-normal font-['Inter'] text-black mb-4">
              {quiz.status === 'in-progress' 
                ? "Congrats! You're in."
                : "The results are in!"
              }
            </h1>
            
            {quiz.status === 'completed' && userScore !== undefined && (
              <div className="text-lg">
                <p className="font-semibold text-gray-900">
                  Your Score: {userScore}/{totalPoints} correct
                </p>
                <p className="text-gray-600 mt-1">
                  Ranked #{userRank} globally
                </p>
              </div>
            )}
          </div>

          {/* Pulsing Banner for In-Progress Quizzes */}
          {quiz.status === 'in-progress' && (
            <div className="mb-6">
              <div className="w-[18rem] mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
                <p className="text-blue-700 text-center font-medium">
                  Results are being tallied
                </p>
                {uniqueAnswer && (
                  <p className="text-blue-600 text-sm mt-2">
                    You are the only person who selected "{uniqueAnswer.answer}" for question #{quiz.questions.findIndex(q => q.id === uniqueAnswer.questionId) + 1}... are you a genius?
                  </p>
                )}
                {!uniqueAnswer && universalAnswer && (
                  <p className="text-blue-600 text-sm mt-2">
                    You and everyone else believe that "{universalAnswer.answer}" is the right answer to question #{quiz.questions.findIndex(q => q.id === universalAnswer.questionId) + 1}. Are you all correct??
                  </p>
                )}
              </div>
            </div>
          )}

          {/* View Submission Button */}
          {quiz.status === 'in-progress' && userSubmission && (
            <div className="mt-6">
              <button
                onClick={() => setShowSubmissionModal(true)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                View Your Submission
              </button>
            </div>
          )}

          {/* Results Section */}
          {quiz.status === 'completed' && userSubmission && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Results</h2>
              <div className="space-y-4">
                {quiz.questions.map((question) => {
                  const userAnswer = userSubmission.answers[question.id];
                  const correctAnswer = quiz.correctAnswers?.[question.id];
                  const isCorrect = userAnswer === correctAnswer;

                  return (
                    <div 
                      key={question.id} 
                      className={`p-4 rounded-lg border ${
                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-gray-900 font-medium">{question.text}</h3>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isCorrect ? `+${question.points}` : '0'} points
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          Your answer: <span className="font-medium">{userAnswer}</span>
                        </p>
                        <p className="text-gray-600">
                          Correct answer: <span className="font-medium">{correctAnswer}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leaderboard Section */}
          {quiz.status === 'completed' && submissions.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Leaderboard</h2>
              <div className="space-y-4">
                {submissions.map((submission, index) => {
                  const isCurrentUser = submission.userId === userSubmission?.userId;
                  const isFirstPlace = index === 0;
                  const [firstName, ...lastNameParts] = submission.userName.split(' ');
                  const lastNameInitial = lastNameParts[lastNameParts.length - 1]?.[0] || '';
                  const formattedName = `${firstName} ${lastNameInitial}.`;

                  return (
                    <div
                      key={submission.id}
                      className={`p-4 rounded-lg border ${
                        isCurrentUser ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-lg font-bold text-gray-900">
                            #{index + 1}
                          </div>
                          <div className="flex items-center space-x-2">
                            {isFirstPlace && (
                              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.363 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                            <div className="font-medium text-gray-900">
                              {formattedName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View results
                          </button>
                          {submission.score !== undefined && (
                            <div className="text-gray-900 font-medium">
                              {submission.score}/{totalPoints}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && userSubmission && quiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Submission</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Submitted on {new Date(userSubmission.submittedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {quiz.questions.map((question) => {
                const userAnswer = userSubmission.answers[question.id];
                return (
                  <div 
                    key={question.id} 
                    className="p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-gray-900 font-medium">{question.text}</h3>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        Your answer: <span className="font-medium">{userAnswer}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Results Modal */}
      {selectedSubmission && quiz && (
        <ResultsModal
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          submission={selectedSubmission}
          quiz={quiz}
        />
      )}
    </div>
  );
} 