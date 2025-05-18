'use client';

import { useEffect, useState, Suspense } from 'react';
import { db } from '../../../lib/firebase/firebase-client';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/UserAuth';
import { ErrorBoundary } from 'react-error-boundary';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white font-['PP_Object_Sans']">Results for {submission.userName}</h2>
            <p className="text-sm text-white/50 mt-1 font-['PP_Object_Sans']">
              Submitted on {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white"
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
                  quiz.status === 'completed'
                    ? (isCorrect ? 'border-[#acc676]/20 bg-[#acc676]/10' : 'border-red-400/20 bg-red-400/10')
                    : 'border-slate-700 bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium font-['PP_Object_Sans']">{question.text}</h3>
                  {quiz.status === 'completed' && (
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      isCorrect ? 'bg-[#acc676]/20 text-[#acc676]' : 'bg-red-400/20 text-red-400'
                    } font-['PP_Object_Sans']`}>
                      {isCorrect ? `+${question.points}` : '0'} points
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-white/70 font-['PP_Object_Sans']">
                    Answer: <span className="font-medium text-white">{userAnswer}</span>
                  </p>
                  {quiz.status === 'completed' && (
                    <p className="text-white/70 font-['PP_Object_Sans']">
                      Correct answer: <span className="font-medium text-white">{correctAnswer}</span>
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
            className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 font-['PP_Object_Sans']"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage({ params, searchParams }: { params: { id: string }, searchParams: { resubmit?: string } }) {
  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please try again.</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <ThankYouContent params={params} searchParams={searchParams} />
      </Suspense>
    </ErrorBoundary>
  );
}

function ThankYouContent({ params, searchParams }: { params: { id: string }, searchParams: { resubmit?: string } }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [uniqueAnswer, setUniqueAnswer] = useState<{questionId: string, answer: string, isMinority?: boolean} | null>(null);
  const [universalAnswer, setUniversalAnswer] = useState<{questionId: string, answer: string, isMajority?: boolean} | null>(null);
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
        if (!db) {
          throw new Error('Firebase db is not initialized');
        }

        // Fetch quiz data
        const quizDoc = await getDoc(doc(db as unknown as Parameters<typeof doc>[0], 'quizzes', params.id));
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

          // Add detailed logging for submissions before sorting
          console.log('All submissions before sorting:', allSubmissions.map(sub => ({
            id: sub.id,
            userName: sub.userName,
            score: sub.score,
            scoreType: sub.score !== undefined ? typeof sub.score : 'undefined',
            submittedAt: sub.submittedAt
          })));

          // Sort submissions by score (if completed) or submission time
          const sortedSubmissions = allSubmissions.sort((a, b) => {
            if (quizData.status === 'completed') {
              // Convert scores to numbers and handle undefined/null values
              const scoreA = typeof a.score === 'number' ? a.score : 0;
              const scoreB = typeof b.score === 'number' ? b.score : 0;
              
              if (scoreA !== scoreB) {
                return scoreB - scoreA; // Higher scores first
              }
            }
            
            // If scores are equal or quiz is in progress, sort by submission time
            const timeA = new Date(a.submittedAt).getTime();
            const timeB = new Date(b.submittedAt).getTime();
            return timeA - timeB; // Earlier submissions first
          });

          // Log final sorted submissions
          console.log('Sorted submissions:', sortedSubmissions.map(sub => ({
            id: sub.id,
            userName: sub.userName,
            score: sub.score,
            scoreType: sub.score !== undefined ? typeof sub.score : 'undefined',
            submittedAt: sub.submittedAt
          })));

          setSubmissions(sortedSubmissions);

          // Find user's submission using userId
          if (user) {
            const userSub = sortedSubmissions.find(sub => sub.userId === user.uid);
            if (userSub) {
              setUserSubmission(userSub);
              
              // Only analyze answers for in-progress quizzes
              if (quizData.status === 'in-progress') {
                const userAnswers = userSub.answers;
                const otherSubmissions = sortedSubmissions.filter(sub => sub.id !== userSub.id);
                
                console.log('Analyzing answers:', {
                  userAnswers,
                  otherSubmissionsCount: otherSubmissions.length,
                  otherSubmissions: otherSubmissions.map(sub => ({
                    id: sub.id,
                    answers: sub.answers
                  }))
                });
                
                // Check for unique answers
                let foundUnique = false;
                for (const [questionId, answer] of Object.entries(userAnswers)) {
                  const isUnique = !otherSubmissions.some(sub => sub.answers[questionId] === answer);
                  console.log('Checking unique answer:', {
                    questionId,
                    answer,
                    isUnique,
                    otherAnswers: otherSubmissions.map(sub => sub.answers[questionId])
                  });
                  
                  if (isUnique) {
                    setUniqueAnswer({ questionId, answer });
                    foundUnique = true;
                    break;
                  }
                }
                
                // If no unique answer found, check for universal answers
                if (!foundUnique) {
                  for (const [questionId, answer] of Object.entries(userAnswers)) {
                    const isUniversal = otherSubmissions.every(sub => sub.answers[questionId] === answer);
                    console.log('Checking universal answer:', {
                      questionId,
                      answer,
                      isUniversal,
                      otherAnswers: otherSubmissions.map(sub => sub.answers[questionId])
                    });
                    
                    if (isUniversal) {
                      setUniversalAnswer({ questionId, answer });
                      break;
                    }
                  }
                }

                // If still no message found, check for majority/minority
                if (!foundUnique && !universalAnswer) {
                  for (const [questionId, answer] of Object.entries(userAnswers)) {
                    const otherAnswers = otherSubmissions.map(sub => sub.answers[questionId]);
                    const answerCount = otherAnswers.filter(a => a === answer).length;
                    const isMajority = answerCount > otherAnswers.length / 2;
                    
                    if (isMajority) {
                      setUniversalAnswer({ 
                        questionId, 
                        answer,
                        isMajority: true 
                      });
                      break;
                    } else {
                      setUniqueAnswer({ 
                        questionId, 
                        answer,
                        isMinority: true 
                      });
                      break;
                    }
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
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="max-w-[380px] w-full mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold font-['PP_Object_Sans'] mb-4">
            Thank You for Your Submission!
          </h1>
          <p className="text-white/50 font-['PP_Object_Sans']">
            Your answers have been recorded. {quiz?.status === 'in-progress' ? 'Check back later to see how you did!' : 'Here\'s how you did!'}
          </p>
        </div>

        {uniqueAnswer && (
          <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-lg p-6 mb-8 animate-pulse">
            <h2 className="text-xl font-semibold font-['PP_Object_Sans'] mb-2">
              You're in the minority!
            </h2>
            <p className="text-white/70 font-['PP_Object_Sans']">
              You're one of the few who selected "{uniqueAnswer.answer}" for Question #{uniqueAnswer.questionId}. Will the minority be right?
            </p>
          </div>
        )}

        {universalAnswer && (
          <div className="bg-[#acc676]/10 border border-[#acc676]/20 rounded-lg p-6 mb-8 animate-pulse">
            <h2 className="text-xl font-semibold font-['PP_Object_Sans'] mb-2">
              You're in the majority!
            </h2>
            <p className="text-white/70 font-['PP_Object_Sans']">
              You're in the majority who selected "{universalAnswer.answer}" for Question #{universalAnswer.questionId}. Will the majority be right?
            </p>
          </div>
        )}

        <div className="space-y-8">
          {quiz?.status === 'completed' ? (
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold font-['PP_Object_Sans'] mb-6">
                Leaderboard
              </h2>
              <div className="space-y-4">
                {submissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      submission.id === userSubmission?.id
                        ? 'bg-[#acc676]/10 border border-[#acc676]/20'
                        : 'bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-white/50 font-['PP_Object_Sans']">#{index + 1}</span>
                      <span className="font-['PP_Object_Sans']">{submission.userName}</span>
                    </div>
                    <div className="text-white/70 font-['PP_Object_Sans']">
                      {submission.score !== undefined ? `${submission.score} points` : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold font-['PP_Object_Sans'] mb-6">
                Other Predictions
              </h2>
              <p className="text-white/70 font-['PP_Object_Sans']">
                {(() => {
                  const otherSubmissions = submissions.filter(sub => sub.id !== userSubmission?.id);
                  if (otherSubmissions.length === 0) {
                    return "You're the first to submit predictions!";
                  }
                  
                  const randomSubmission = otherSubmissions[Math.floor(Math.random() * otherSubmissions.length)];
                  const [firstName, ...lastNameParts] = randomSubmission.userName.split(' ');
                  const lastNameInitial = lastNameParts[lastNameParts.length - 1]?.[0] || '';
                  const formattedName = `${firstName} ${lastNameInitial}.`;
                  
                  return `${formattedName} and ${otherSubmissions.length - 1} more have sent in their predictions.`;
                })()}
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => setShowSubmissionModal(true)}
              className="min-w-[140px] max-w-full px-6 py-3 text-center whitespace-nowrap bg-[#acc676] text-white rounded-lg hover:bg-[#acc676]/90 transition-colors font-['PP_Object_Sans']"
            >
              View Your Submission
            </button>
          </div>
        </div>
      </div>

      <ResultsModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        submission={userSubmission!}
        quiz={quiz!}
      />
    </div>
  );
} 