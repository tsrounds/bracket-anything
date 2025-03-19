'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '../../../lib/firebase/firebase-client';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './thank-you.module.css';

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
  deadline: string;
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

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsDeadlinePassed(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (isDeadlinePassed) {
    return (
      <div className={styles.pulseNotification}>
        Results will be tallied soon
      </div>
    );
  }

  return (
    <div className={styles.countdownContainer}>
      <div className={styles.countdownItem}>
        <span className={styles.countdownValue}>{timeLeft.days}</span>
        <span className={styles.countdownLabel}>Days</span>
      </div>
      <div className={styles.countdownItem}>
        <span className={styles.countdownValue}>{timeLeft.hours}</span>
        <span className={styles.countdownLabel}>Hours</span>
      </div>
      <div className={styles.countdownItem}>
        <span className={styles.countdownValue}>{timeLeft.minutes}</span>
        <span className={styles.countdownLabel}>Minutes</span>
      </div>
      <div className={styles.countdownItem}>
        <span className={styles.countdownValue}>{timeLeft.seconds}</span>
        <span className={styles.countdownLabel}>Seconds</span>
      </div>
    </div>
  );
}

function Confetti() {
  const confettiRef = useRef<HTMLDivElement>(null);
  const pieces = Array.from({ length: 50 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 4000); // Match the animation duration

    return () => {
      clearTimeout(timeout);
      if (confettiRef.current) {
        confettiRef.current.innerHTML = '';
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div ref={confettiRef} className={styles.confetti}>
      {pieces.map((_, index) => (
        <div
          key={index}
          className={styles.confettiPiece}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function ThankYouPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchQuizAndSubmissions = async () => {
      try {
        // Fetch quiz data
        const quizDoc = await getDoc(doc(db, 'quizzes', params.id));
        if (quizDoc.exists()) {
          const quizData = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
          setQuiz(quizData);

          // If quiz is not completed, don't fetch submissions
          if (quizData.status !== 'completed') {
            setLoading(false);
            return;
          }

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

          // Find user's submission
          const userName = sessionStorage.getItem('userName');
          const userSub = sortedSubmissions.find(sub => sub.userName === userName);
          if (userSub) {
            setUserSubmission(userSub);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndSubmissions();
  }, [params.id]);

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
  const userRank = userSubmission ? submissions.findIndex(s => s.userName === userSubmission.userName) + 1 : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Confetti />
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Quiz Cover Image */}
          <div className="relative">
            <img 
              src={quiz.coverImage || "https://placehold.co/800x400"} 
              alt="Quiz cover"
              className={styles.coverImage}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Congrats! You're in.
              </h1>
              
              {quiz.status === 'in-progress' && (
                <CountdownTimer deadline={quiz.deadline} />
              )}
              
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

            {/* Results Section */}
            {quiz.status === 'completed' && userSubmission && (
              <div className="mb-8">
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

            {/* Leaderboard Section - Only show if quiz is completed */}
            {quiz.status === 'completed' && submissions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Leaderboard</h2>
                <div className="space-y-4">
                  {submissions.map((submission, index) => {
                    const isCurrentUser = submission.userName === userSubmission?.userName;

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
                            <div>
                              <div className="font-medium text-gray-900">
                                {submission.userName}
                              </div>
                              <div className="text-sm text-gray-500">
                                Submitted on {new Date(submission.submittedAt).toLocaleString()}
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

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>

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