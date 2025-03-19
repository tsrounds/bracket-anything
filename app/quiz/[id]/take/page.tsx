'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../lib/firebase/firebase-client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../../components/UserAuth';
import UserAuth from '../../../components/UserAuth';
import styles from './quiz.module.css';

interface Question {
  id: string;
  text: string;
  options: string[];
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  questions: Question[];
  status: 'active' | 'completed';
}

type Props = {
  params: {
    id: string;
  };
}

export default function TakeQuiz({ params }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', params.id));
        if (quizDoc.exists()) {
          setQuiz({ id: quizDoc.id, ...quizDoc.data() } as Quiz);
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user profile
      const userProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      if (!userProfileDoc.exists()) {
        throw new Error('User profile not found');
      }
      const userProfile = userProfileDoc.data();

      // Create submission document
      const submissionRef = doc(db, 'submissions', `${params.id}_${user.uid}`);
      const submissionData = {
        userId: user.uid,
        userName: userProfile.name,
        quizId: params.id,
        answers,
        submittedAt: new Date().toISOString(),
        totalQuestions: quiz?.questions.length || 0,
        totalAnswered: Object.keys(answers).length,
      };

      await setDoc(submissionRef, submissionData);

      // Redirect to thank you page
      router.push(`/quiz/${params.id}/thank-you`);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <UserAuth />;
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

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setFadeOut(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setFadeOut(false);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setFadeOut(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setFadeOut(false);
      }, 300);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    console.log('Answer selected:', answer);
    setSelectedAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Automatically move to next question after a longer delay to show checkmark
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setTimeout(() => {
        console.log('Moving to next question');
        setSelectedAnswer(null);
        handleNext();
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className={`${styles['quiz-container']} w-80 h-[688px] relative bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border border-gray-200`}>
        <div className={`${styles['quiz-cover']} p-3 pb-[18px]`}>
          <img
            src={quiz.coverImage || "https://placehold.co/316x202"}
            alt={quiz.title}
            className="w-full h-52 rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.30)] object-cover"
          />
        </div>

        <div className={`${styles['quiz-question-section']} absolute top-[238px] left-0 right-0 px-3`}>
          <div className={`${styles['quiz-content']} transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            <h2 className={`${styles['quiz-title']} text-xl font-normal font-['Inter'] text-black mb-[18px] text-center px-4`}>
              {currentQuestion.text}
            </h2>

            <div className={`${styles['quiz-options']} space-y-[18px]`}>
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option;
                console.log('Option:', option, 'Selected:', isSelected);
                
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                    className={`${styles['quiz-option']} h-12 relative rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.30)] group transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#ACC676] transform scale-[1.02]'
                        : 'bg-neutral-900/60 hover:transform hover:scale-[1.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between px-6 py-3">
                      <span className="text-white text-base font-normal font-['Inter']">
                        {option}
                      </span>
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        {isSelected ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg 
                              className="w-6 h-6 text-white"
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={3} 
                                d="M5 13l4 4L19 7" 
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-[2.46px] border-white" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {currentQuestionIndex === totalQuestions - 1 && (
                <div className={`${styles['quiz-submit']} flex justify-center`}>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || Object.keys(answers).length !== totalQuestions}
                    className="w-48 h-12 relative rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all duration-300"
                  >
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 