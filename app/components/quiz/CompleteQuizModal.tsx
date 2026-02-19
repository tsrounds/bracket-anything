'use client';

import { useState, useEffect } from 'react';
import {
  ValidationResult,
  QuizQuestion,
} from '@/app/lib/validation/types';
import AnswerSelectionModal from '../AnswerSelectionModal';
import AnswerPreview from './AnswerPreview';

type Mode = 'choose' | 'manual' | 'auto';
type AutoStep = 'validating' | 'preview' | 'error';

interface CompleteQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: Record<string, string | string[]>) => void;
  questions: QuizQuestion[];
  quizTitle: string;
  quizId?: string;
}

export default function CompleteQuizModal({
  isOpen,
  onClose,
  onComplete,
  questions,
  quizTitle,
  quizId,
}: CompleteQuizModalProps) {
  const [mode, setMode] = useState<Mode>('choose');
  const [autoStep, setAutoStep] = useState<AutoStep>('validating');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch AI answers when entering auto mode
  useEffect(() => {
    if (mode !== 'auto' || autoStep !== 'validating') return;

    const fetchAnswers = async () => {
      setError(null);
      try {
        const res = await fetch('/api/auto-complete/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizTitle, questions }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to get AI answers');
        }

        const result: ValidationResult = await res.json();
        setValidationResult(result);
        setAutoStep('preview');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch answers');
        setAutoStep('error');
      }
    };

    fetchAnswers();
  }, [mode, autoStep, quizTitle, questions]);

  if (!isOpen) return null;

  const handleClose = () => {
    setMode('choose');
    setAutoStep('validating');
    setValidationResult(null);
    setError(null);
    onClose();
  };

  const handleAutoComplete = () => {
    setMode('auto');
    setAutoStep('validating');
  };

  const handleRetry = () => {
    setAutoStep('validating');
  };

  const handleAcceptAnswers = (answers: Record<string, string>) => {
    onComplete(answers);
    handleClose();
  };

  // Manual mode: delegate to existing AnswerSelectionModal
  if (mode === 'manual') {
    return (
      <AnswerSelectionModal
        isOpen={true}
        onClose={handleClose}
        onComplete={(answers) => {
          onComplete(answers);
          handleClose();
        }}
        questions={questions}
        quizTitle={quizTitle}
        quizId={quizId}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Complete Quiz: {quizTitle}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Choose mode step */}
        {mode === 'choose' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              How would you like to enter the correct answers?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('manual')}
                className="flex flex-col items-center p-6 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors group"
              >
                <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="font-medium text-gray-900 group-hover:text-indigo-700">
                  Manual Entry
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Enter answers yourself
                </span>
              </button>

              <button
                onClick={handleAutoComplete}
                className="flex flex-col items-center p-6 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors group relative"
              >
                <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium text-gray-900 group-hover:text-indigo-700">
                  Ask AI
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Let AI find the answers
                </span>
                <span className="absolute -top-2 -right-2 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  New
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Auto-complete flow */}
        {mode === 'auto' && (
          <div>
            {autoStep === 'validating' && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-4" />
                <p className="text-sm text-gray-600">
                  AI is finding the answers...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  This may take a few seconds
                </p>
              </div>
            )}

            {autoStep === 'preview' && validationResult && (
              <AnswerPreview
                validationResult={validationResult}
                questions={questions}
                onAccept={handleAcceptAnswers}
                onBack={() => { setMode('choose'); setAutoStep('validating'); }}
              />
            )}

            {autoStep === 'error' && (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setMode('manual')}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Switch to Manual
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
