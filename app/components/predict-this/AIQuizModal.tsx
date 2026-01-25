'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AIGeneratedQuiz, AIGeneratedQuestionType } from '@/app/lib/predict-this/ai-schemas';

type ModalStep = 'input' | 'clarification' | 'loading' | 'preview' | 'error';

interface AIQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizGenerated: (quiz: AIGeneratedQuiz) => void;
}

export default function AIQuizModal({
  isOpen,
  onClose,
  onQuizGenerated,
}: AIQuizModalProps) {
  const [step, setStep] = useState<ModalStep>('input');
  const [context, setContext] = useState('');
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [generatedQuiz, setGeneratedQuiz] = useState<AIGeneratedQuiz | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetModal = () => {
    setStep('input');
    setContext('');
    setClarificationQuestions([]);
    setClarificationAnswers({});
    setGeneratedQuiz(null);
    setError(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const analyzeContext = async () => {
    setStep('loading');
    setError(null);

    try {
      const res = await fetch('/api/quiz/generate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed with ${res.status}`);
      }

      const data = await res.json();

      if (data.needsClarification && data.clarificationQuestions?.length > 0) {
        setClarificationQuestions(data.clarificationQuestions);
        setStep('clarification');
      } else {
        // No clarification needed, generate directly
        await generateQuiz();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze context');
      setStep('error');
    }
  };

  const generateQuiz = async () => {
    setStep('loading');
    setError(null);

    try {
      const res = await fetch('/api/quiz/generate/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          clarifications: Object.keys(clarificationAnswers).length > 0 ? clarificationAnswers : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed with ${res.status}`);
      }

      const data = await res.json();
      setGeneratedQuiz(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      setStep('error');
    }
  };

  const handleSubmitClarifications = () => {
    // Check all questions have answers
    const allAnswered = clarificationQuestions.every(
      (q) => clarificationAnswers[q]?.trim()
    );
    if (!allAnswered) {
      setError('Please answer all questions');
      return;
    }
    generateQuiz();
  };

  const handleAcceptQuiz = () => {
    if (generatedQuiz) {
      onQuizGenerated(generatedQuiz);
      handleClose();
    }
  };

  const handleRegenerate = () => {
    setGeneratedQuiz(null);
    if (clarificationQuestions.length > 0) {
      generateQuiz();
    } else {
      analyzeContext();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#1e293b] border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white font-['PP_Object_Sans']">
              {step === 'input' && 'Generate Quiz with AI'}
              {step === 'clarification' && 'A few more details...'}
              {step === 'loading' && 'Creating your quiz...'}
              {step === 'preview' && 'Your Generated Quiz'}
              {step === 'error' && 'Something went wrong'}
            </h2>
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Input Step */}
            {step === 'input' && (
              <div className="space-y-4">
                <p className="text-white/70 font-['PP_Object_Sans']">
                  Describe the event you want to create a prediction quiz about. Be as specific as possible!
                </p>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., 2026 Oscars Best Picture predictions, Super Bowl LX, March Madness 2026 Final Four..."
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 font-['PP_Object_Sans'] focus:outline-none focus:border-[#F58143] resize-none"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-white/70 hover:text-white font-['PP_Object_Sans'] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={analyzeContext}
                    disabled={!context.trim()}
                    className="px-6 py-2 bg-[#F58143] text-white rounded-lg font-semibold font-['PP_Object_Sans'] hover:bg-[#ff9a5c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Clarification Step */}
            {step === 'clarification' && (
              <div className="space-y-4">
                <p className="text-white/70 font-['PP_Object_Sans']">
                  To create the best quiz, I need a bit more information:
                </p>
                {clarificationQuestions.map((question, index) => (
                  <div key={index} className="space-y-2">
                    <label className="block text-white font-['PP_Object_Sans']">
                      {question}
                    </label>
                    <input
                      type="text"
                      value={clarificationAnswers[question] || ''}
                      onChange={(e) =>
                        setClarificationAnswers((prev) => ({
                          ...prev,
                          [question]: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 font-['PP_Object_Sans'] focus:outline-none focus:border-[#F58143]"
                    />
                  </div>
                ))}
                {error && (
                  <p className="text-red-400 text-sm font-['PP_Object_Sans']">{error}</p>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setStep('input')}
                    className="px-4 py-2 text-white/70 hover:text-white font-['PP_Object_Sans'] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitClarifications}
                    className="px-6 py-2 bg-[#F58143] text-white rounded-lg font-semibold font-['PP_Object_Sans'] hover:bg-[#ff9a5c] transition-colors"
                  >
                    Generate Quiz
                  </button>
                </div>
              </div>
            )}

            {/* Loading Step */}
            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-white/20 border-t-[#F58143] rounded-full animate-spin" />
                <p className="text-white/70 font-['PP_Object_Sans']">
                  Generating 10 prediction questions...
                </p>
              </div>
            )}

            {/* Preview Step */}
            {step === 'preview' && generatedQuiz && (
              <div className="space-y-6">
                {/* Title & Deadline */}
                <div className="space-y-3">
                  <div>
                    <span className="text-white/50 text-sm font-['PP_Object_Sans']">Quiz Title</span>
                    <p className="text-white text-lg font-semibold font-['PP_Object_Sans']">
                      {generatedQuiz.title}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50 text-sm font-['PP_Object_Sans']">Suggested Deadline</span>
                    <p className="text-white font-['PP_Object_Sans']">
                      {new Date(generatedQuiz.deadline).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Questions Preview */}
                <div className="space-y-3">
                  <span className="text-white/50 text-sm font-['PP_Object_Sans']">
                    Questions ({generatedQuiz.questions.length})
                  </span>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {generatedQuiz.questions.map((q: AIGeneratedQuestionType, index: number) => (
                      <div
                        key={q.id}
                        className="p-3 bg-white/5 border border-white/10 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-[#F58143] font-bold font-['PP_Object_Sans']">
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="text-white font-['PP_Object_Sans'] text-sm">
                              {q.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/60">
                                {q.type === 'multiple' ? 'Multiple Choice' : 'Open Ended'}
                              </span>
                              <span className="text-xs text-white/40">
                                {q.points} {q.points === 1 ? 'point' : 'points'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t border-white/10">
                  <button
                    onClick={handleRegenerate}
                    className="px-4 py-2 text-white/70 hover:text-white font-['PP_Object_Sans'] transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                  <button
                    onClick={handleAcceptQuiz}
                    className="px-6 py-2 bg-[#38bdf8] text-white rounded-lg font-semibold font-['PP_Object_Sans'] hover:bg-[#56c8fa] transition-colors"
                  >
                    Accept & Edit
                  </button>
                </div>
              </div>
            )}

            {/* Error Step */}
            {step === 'error' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-400 font-['PP_Object_Sans']">
                    {error || 'An unexpected error occurred. Please try again.'}
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-white/70 hover:text-white font-['PP_Object_Sans'] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep('input')}
                    className="px-6 py-2 bg-[#F58143] text-white rounded-lg font-semibold font-['PP_Object_Sans'] hover:bg-[#ff9a5c] transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
