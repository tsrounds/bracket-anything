'use client';

import { useEffect, useState, Suspense } from 'react';
import { db } from '../../../../lib/firebase/firebase-client';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../components/UserAuth';
import { ErrorBoundary } from 'react-error-boundary';
import AnimatedButton from '../../../../components/AnimatedButton';

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

const AVATAR_BLUE = '#67D3F6';

function AvatarCircle({ avatar, name, colorIndex }: { avatar?: string; name: string; colorIndex: number }) {
  const shadow = '0 4px 16px 0 rgba(0,0,0,0.28), 0 2px 8px 0 rgba(0,0,0,0.18)';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-12 h-12 rounded-full object-cover"
        style={{
          zIndex: 10 - colorIndex,
          position: 'relative',
          background: AVATAR_BLUE,
          boxShadow: shadow,
          border: 'none',
        }}
      />
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
      style={{
        background: AVATAR_BLUE,
        color: '#222',
        zIndex: 10 - colorIndex,
        position: 'relative',
        boxShadow: shadow,
        border: 'none',
      }}
    >
      {name[0]?.toUpperCase() || '?'}
    </div>
  );
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#232734] border border-[#35394a] rounded-2xl px-8 py-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white font-['PP_Object_Sans']">Results for <span className="break-all">{submission.userName}</span></h2>
            <p className="text-sm text-slate-400 mt-1 font-['PP_Object_Sans']">
              Submitted on {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-full p-2 transition focus:outline-none focus:ring-2 focus:ring-slate-600"
            aria-label="Close"
            style={{ lineHeight: 0 }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {quiz.questions.map((question) => {
            const userAnswer = submission.answers[question.id];
            const correctAnswer = quiz.correctAnswers?.[question.id];
            const isCorrect = userAnswer === correctAnswer;

            return (
              <div 
                key={question.id} 
                className={`p-5 rounded-xl border flex flex-col gap-2 transition-colors
                  ${quiz.status === 'completed'
                    ? isCorrect
                      ? 'bg-[#2e3a2e] border-green-700'
                      : 'bg-[#2d2936] border-[#4b2d36]'
                    : 'bg-[#232734] border-[#35394a]'}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-lg font-semibold text-white font-['PP_Object_Sans']">{question.text}</h3>
                  {quiz.status === 'completed' && (
                    <span className={`px-3 py-1 rounded text-sm font-semibold font-['PP_Object_Sans']
                      ${isCorrect
                        ? 'bg-green-700/20 text-green-400'
                        : 'bg-[#4b2d36]/30 text-red-300'}
                    `}>
                      {isCorrect ? `+${question.points}` : '0'}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-300 font-['PP_Object_Sans']">
                    <span className="text-slate-400">Answer:</span> <span className="font-medium text-white">{userAnswer}</span>
                  </p>
                  {quiz.status === 'completed' && (
                    <p className="text-slate-300 font-['PP_Object_Sans']">
                      <span className="text-slate-400">Correct answer:</span> <span className="font-medium text-white">{correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-['PP_Object_Sans'] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function calculateScore(submission: Submission, quiz: Quiz): number {
  if (typeof submission.score === 'number') return submission.score;
  if (!quiz?.correctAnswers || !quiz?.questions) return 0;
  let score = 0;
  for (const q of quiz.questions) {
    if (submission.answers?.[q.id] === quiz.correctAnswers[q.id]) {
      score += q.points;
    }
  }
  return score;
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
  const [showGif, setShowGif] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const [avatarMap, setAvatarMap] = useState<Record<string, string | undefined>>({});

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

          // Fetch avatars for all unique userIds in submissions
          const userIds = Array.from(new Set(sortedSubmissions.map(sub => sub.userId)));
          const avatarMap: Record<string, string | undefined> = {};
          if (db) {
            await Promise.all(userIds.map(async (uid) => {
              try {
                const userProfileDoc = await getDoc(doc(db as any, 'userProfiles', uid));
                avatarMap[uid] = userProfileDoc.exists() ? userProfileDoc.data().avatar : undefined;
              } catch (e) {
                avatarMap[uid] = undefined;
              }
            }));
          }
          setAvatarMap(avatarMap);

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

  useEffect(() => {
    setShowGif(false);
    const timer = setTimeout(() => setShowGif(true), 400);
    return () => clearTimeout(timer);
  }, []);

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

  // Create a sorted leaderboard array (by score, then submission time)
  const sortedLeaderboard = [...submissions]
    .map(sub => ({ ...sub, _score: calculateScore(sub, quiz) }))
    .sort((a, b) => b._score - a._score || new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  // Calculate userRank from the sorted leaderboard
  const userRank = userSubmission ? sortedLeaderboard.findIndex(s => s.userId === userSubmission.userId) + 1 : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="max-w-[380px] w-full mx-auto px-4 py-12">
        <div className="text-center mb-8">
          {quiz.status === 'in-progress' && (
            <img
              src="/animations/totalgif.gif"
              alt="Celebration animation"
              className="mx-auto mb-4 w-32 h-32 object-contain"
              style={{ pointerEvents: 'none' }}
            />
          )}
          <h1 className="text-3xl font-extrabold font-['PP_Object_Sans'] mb-4">
            {quiz.status === 'in-progress' ? "You're In!" : quiz.title}
          </h1>
        </div>

        {uniqueAnswer && (
          <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-lg p-6 mb-8 animate-pulse">
            <h2 className="text-xl font-semibold font-['PP_Object_Sans'] mb-2">
              You're in the minority!
            </h2>
            <p className="text-white/70 font-['PP_Object_Sans']">
              You're one of the few who selected "{uniqueAnswer.answer}" for Question #{uniqueAnswer.questionId}. Are you smarter than the rest?
            </p>
          </div>
        )}

        {universalAnswer && (
          <div className="bg-[#acc676]/10 border border-[#acc676]/20 rounded-lg p-6 mb-8 animate-pulse">
            <h2 className="text-xl font-semibold font-['PP_Object_Sans'] mb-2">
              You're in the majority!
            </h2>
            <p className="text-white/70 font-['PP_Object_Sans']">
              You're in the majority who selected "{universalAnswer.answer}" for Question #{universalAnswer.questionId}. Are you smarter than the rest?
            </p>
          </div>
        )}

        {quiz?.status === 'in-progress' && (
          <div className="bg-slate-800/50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold font-['PP_Object_Sans'] mb-2">
              {(() => {
                const otherSubmissions = submissions.filter(sub => sub.id !== userSubmission?.id);
                if (otherSubmissions.length === 0) {
                  return "You're the first to submit predictions!";
                }
                if (otherSubmissions.length === 1) {
                  // Only 2 people (user + 1 other)
                  const randomSubmission = otherSubmissions[0];
                  const [firstName] = randomSubmission.userName.split(' ');
                  return `${firstName} and you are the first to submit`;
                }
                // More than 2 people
                const randomSubmission = otherSubmissions[Math.floor(Math.random() * otherSubmissions.length)];
                const [firstName] = randomSubmission.userName.split(' ');
                return `${firstName} and ${otherSubmissions.length - 1} others have submitted.`;
              })()}
            </h2>
            <div className="flex items-center justify-center mt-4" style={{ gap: '-16px' }}>
              {(() => {
                const otherSubmissions = submissions.filter(sub => sub.id !== userSubmission?.id);
                const shown = otherSubmissions.slice(0, 3);
                return (
                  <div className="flex -space-x-4">
                    {shown.map((sub, i) => (
                      <div key={sub.id} style={{ zIndex: 10 - i }}>
                        <AvatarCircle avatar={avatarMap[sub.userId]} name={sub.userName} colorIndex={i} />
                      </div>
                    ))}
                    {otherSubmissions.length > 3 && (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 border-slate-900 bg-slate-700 text-white"
                        style={{ zIndex: 6 }}
                      >
                        +{otherSubmissions.length - 3}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            {/* View your submission button for in-progress quizzes */}
            {userSubmission && (
              <div className="flex justify-center mt-6">
                <AnimatedButton
                  className="w-[180px] h-12 font-['PP_Object_Sans'] text-white text-sm font-normal rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-[#F58143] shadow-[0_2px_8px_0_rgba(245,129,67,0.18)]"
                  onClick={() => setShowSubmissionModal(true)}
                >
                  View your submission
                </AnimatedButton>
              </div>
            )}
          </div>
        )}

        {/* ResultsModal for selected submission (leaderboard view) */}
        {selectedSubmission && quiz && (
          <ResultsModal
            isOpen={!!selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
            submission={selectedSubmission}
            quiz={quiz}
          />
        )}

        {/* ResultsModal for user's own submission (in-progress view) */}
        {quiz?.status === 'in-progress' && userSubmission && (
          <ResultsModal
            isOpen={showSubmissionModal}
            onClose={() => setShowSubmissionModal(false)}
            submission={userSubmission}
            quiz={quiz}
          />
        )}

        {/* LEADERBOARD for completed quizzes */}
        {quiz?.status === 'completed' && (
          <div className="bg-[#232734] border border-[#35394a] rounded-2xl p-6 mb-8 max-w-md mx-auto text-white shadow-2xl">
            <div className="mb-4">
              <h2 className="text-2xl font-bold font-['PP_Object_Sans'] text-white">Leaderboard</h2>
              {userRank && (
                <div className="mt-1 text-lg font-semibold text-green-400 font-['PP_Object_Sans']">
                  You came in {userRank}{userRank === 1 ? 'st' : userRank === 2 ? 'nd' : userRank === 3 ? 'rd' : 'th'}!
                </div>
              )}
            </div>
            <div className="">
              <div className="grid grid-cols-[32px_40px_1fr_56px_40px] gap-x-3 text-left text-xs font-semibold text-slate-400 px-2 pb-2 select-none">
                <div></div>
                <div></div>
                <div>Name</div>
                <div className="text-center">Pts</div>
                <div></div>
              </div>
              <div>
                {sortedLeaderboard
                  .map((sub, idx) => {
                    const isCurrentUser = userSubmission && sub.userId === userSubmission.userId;
                    return (
                      <div
                        key={sub.id}
                        className={`grid grid-cols-[32px_40px_1fr_56px_40px] gap-x-3 items-center py-2 px-2 border-b border-[#35394a] last:border-b-0 transition-colors
                          ${isCurrentUser ? 'bg-green-900/40 rounded-lg' : ''}
                          ${!isCurrentUser ? 'even:bg-[#262a38]' : ''}`}
                        style={{ minWidth: 0 }}
                      >
                        <div className="text-center font-bold text-base" style={{ color: isCurrentUser ? '#a3e635' : '#67D3F6', width: 32 }}>{idx + 1}</div>
                        <div className="flex justify-center items-center" style={{ width: 40, height: 40 }}>
                          <span className="block w-10 h-10 rounded-full overflow-hidden bg-sky-300 flex items-center justify-center shadow" style={{ minWidth: 40, minHeight: 40 }}>
                            <AvatarCircle avatar={avatarMap[sub.userId]} name={sub.userName} colorIndex={idx} />
                          </span>
                        </div>
                        <div className={`truncate font-['PP_Object_Sans'] text-sm ${isCurrentUser ? 'font-bold text-green-200' : 'text-slate-100'}`} style={{ minWidth: 0 }}>{sub.userName}</div>
                        <div className="text-center font-semibold font-['PP_Object_Sans'] text-slate-200" style={{ width: 56 }}>{sub._score}</div>
                        <div className="flex justify-end items-center" style={{ width: 40 }}>
                          <button
                            className="group relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-700 transition"
                            onClick={() => { setSelectedSubmission(sub); }}
                            aria-label="View Details"
                          >
                            {/* Eye SVG icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-300 group-hover:text-white">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                              <circle cx="12" cy="12" r="3" fill="currentColor" className="text-slate-400 group-hover:text-white" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
} 