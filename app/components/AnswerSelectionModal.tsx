import { useState, useEffect } from 'react';
import { db } from '@/app/lib/firebase/firebase-client';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Question {
  id: string;
  type: 'multiple' | 'open';
  text: string;
  points: number;
  options?: string[];
}

interface AnswerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: Record<string, string | string[]>) => void;
  questions: Question[];
  quizTitle: string;
  quizId?: string;
}

export default function AnswerSelectionModal({
  isOpen,
  onClose,
  onComplete,
  questions,
  quizTitle,
  quizId,
}: AnswerSelectionModalProps) {
  // Used for multiple-choice and custom-mode open-ended
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Used for card-selection open-ended (multi-select)
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({});
  const [submissionAnswers, setSubmissionAnswers] = useState<Record<string, Record<string, { count: number; names: string[] }>>>({});
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [customMode, setCustomMode] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen || !quizId || !db) return;

    const fetchSubmissions = async () => {
      setSubmissionsLoading(true);
      try {
        const submissionsRef = collection(db!, 'submissions');
        const q = query(submissionsRef, where('quizId', '==', quizId));
        const snapshot = await getDocs(q);

        const tally: Record<string, Record<string, { count: number; names: string[] }>> = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const submissionAnswers: Record<string, string> = data.answers || {};
          const participantName: string = data.userName || 'Unknown';
          Object.entries(submissionAnswers).forEach(([questionId, answerText]) => {
            if (!answerText?.trim()) return;
            if (!tally[questionId]) tally[questionId] = {};
            const normalized = answerText.trim();
            if (!tally[questionId][normalized]) {
              tally[questionId][normalized] = { count: 0, names: [] };
            }
            tally[questionId][normalized].count += 1;
            tally[questionId][normalized].names.push(participantName);
          });
        });

        setSubmissionAnswers(tally);
      } catch (err) {
        console.error('Error fetching submissions for review:', err);
      } finally {
        setSubmissionsLoading(false);
      }
    };

    fetchSubmissions();
  }, [isOpen, quizId]);

  if (!isOpen) return null;

  const toggleMultiAnswer = (questionId: string, answerText: string, checked: boolean) => {
    setMultiAnswers(prev => {
      const current = prev[questionId] || [];
      if (checked) return { ...prev, [questionId]: [...current, answerText] };
      return { ...prev, [questionId]: current.filter(a => a !== answerText) };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const combined: Record<string, string | string[]> = { ...answers };
    questions.forEach(q => {
      if (q.type === 'open' && !customMode[q.id]) {
        const selected = multiAnswers[q.id] || [];
        if (selected.length === 1) combined[q.id] = selected[0];
        else if (selected.length > 1) combined[q.id] = selected;
      }
    });
    onComplete(combined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Complete Quiz: {quizTitle}</h2>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">{question.text}</h3>
                <span className="text-sm text-gray-500">{question.points} points</span>
              </div>

              {question.type === 'multiple' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => setAnswers(prev => ({
                          ...prev,
                          [question.id]: e.target.value
                        }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        required
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'open' && (
                <div className="space-y-2">
                  {submissionsLoading ? (
                    <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                      <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                      Loading participant answers...
                    </div>
                  ) : (() => {
                    const tally = submissionAnswers[question.id];
                    const hasSubmissions = tally && Object.keys(tally).length > 0;
                    const selectedCount = (multiAnswers[question.id] || []).length;

                    return (
                      <>
                        {hasSubmissions && !customMode[question.id] && (
                          <>
                            <p className="text-xs text-gray-500 mb-2">
                              Select all correct answers from what participants submitted:
                            </p>
                            <div className="space-y-2">
                              {Object.entries(tally)
                                .sort((a, b) => b[1].count - a[1].count)
                                .map(([answerText, { names }]) => {
                                  const isSelected = (multiAnswers[question.id] || []).includes(answerText);
                                  return (
                                    <label
                                      key={answerText}
                                      className={`flex items-start gap-3 w-full px-4 py-3 rounded-md border text-sm cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-300'
                                          : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => toggleMultiAnswer(question.id, answerText, e.target.checked)}
                                        className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded flex-shrink-0"
                                      />
                                      <div>
                                        <span className="block font-medium">{answerText}</span>
                                        <span className="text-xs text-gray-400 mt-0.5 block">
                                          {names.join(', ')}
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                            </div>
                            {selectedCount > 0 && (
                              <p className="text-xs text-indigo-600 mt-1">
                                {selectedCount} answer{selectedCount > 1 ? 's' : ''} selected as correct
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setCustomMode(prev => ({ ...prev, [question.id]: true }));
                                setMultiAnswers(prev => ({ ...prev, [question.id]: [] }));
                              }}
                              className="mt-2 text-xs text-gray-500 hover:text-indigo-600 underline"
                            >
                              Write custom answer instead
                            </button>
                            {/* Hidden required input to enforce at least one selection */}
                            <input
                              type="text"
                              value={selectedCount > 0 ? 'valid' : ''}
                              required
                              readOnly
                              className="sr-only"
                              aria-hidden="true"
                            />
                          </>
                        )}

                        {(!hasSubmissions || customMode[question.id]) && (
                          <div>
                            {customMode[question.id] && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomMode(prev => ({ ...prev, [question.id]: false }));
                                  setAnswers(prev => ({ ...prev, [question.id]: '' }));
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 underline mb-2 block"
                              >
                                Back to participant answers
                              </button>
                            )}
                            {!hasSubmissions && !customMode[question.id] && (
                              <p className="text-xs text-gray-400 mb-1 italic">
                                No participant answers yet. Enter the correct answer manually.
                              </p>
                            )}
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Correct Answer
                            </label>
                            <textarea
                              value={answers[question.id] || ''}
                              onChange={(e) => setAnswers(prev => ({
                                ...prev,
                                [question.id]: e.target.value
                              }))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              rows={3}
                              required
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Complete Quiz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
