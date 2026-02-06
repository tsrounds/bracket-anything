import { useState } from 'react';
import { ValidationResult, QuizQuestion } from '@/app/lib/validation/types';
import ConfidenceBadge from './ConfidenceBadge';

interface AnswerPreviewProps {
  validationResult: ValidationResult;
  questions: QuizQuestion[];
  onAccept: (answers: Record<string, string>) => void;
  onBack: () => void;
}

export default function AnswerPreview({
  validationResult,
  questions,
  onAccept,
  onBack,
}: AnswerPreviewProps) {
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const match of validationResult.matches) {
      if (match.suggestedAnswer) {
        initial[match.questionId] = match.suggestedAnswer;
      }
    }
    return initial;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set());

  const lowConfidenceCount = validationResult.matches.filter(m => m.confidence < 0.5).length;
  const unmatchedCount = validationResult.unmatchedQuestions.length;
  const allAnswered = questions.every(q => editedAnswers[q.id]?.trim());

  const handleEdit = (questionId: string, value: string) => {
    setEditedAnswers(prev => ({ ...prev, [questionId]: value }));
    setEditedIds(prev => new Set(prev).add(questionId));
  };

  const handleAccept = () => {
    onAccept(editedAnswers);
  };

  const overallPct = Math.round(validationResult.overallConfidence * 100);

  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-indigo-600 hover:text-indigo-800 mb-3 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            {validationResult.eventTitle}
          </h3>
          <span className="text-xs text-gray-500">
            via {validationResult.source}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Overall confidence:</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                overallPct >= 85
                  ? 'bg-green-500'
                  : overallPct >= 70
                  ? 'bg-yellow-500'
                  : overallPct >= 50
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700">{overallPct}%</span>
        </div>
      </div>

      {/* Warnings */}
      {(lowConfidenceCount > 0 || unmatchedCount > 0) && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          {unmatchedCount > 0 && (
            <p>{unmatchedCount} question(s) could not be matched - please fill in manually.</p>
          )}
          {lowConfidenceCount > 0 && (
            <p>{lowConfidenceCount} answer(s) have low confidence - please review.</p>
          )}
        </div>
      )}

      {/* Answer list */}
      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
        {validationResult.matches.map((match) => {
          const question = questions.find(q => q.id === match.questionId);
          const isEditing = editingId === match.questionId;
          const wasEdited = editedIds.has(match.questionId);
          const currentValue = editedAnswers[match.questionId] || '';

          return (
            <div
              key={match.questionId}
              className={`border rounded-lg p-3 ${
                match.confidence === 0
                  ? 'border-red-300 bg-red-50'
                  : wasEdited
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-gray-900 flex-1">
                  {match.questionText}
                </h4>
                {match.confidence > 0 && <ConfidenceBadge confidence={match.confidence} />}
              </div>

              {isEditing ? (
                <div className="mt-2">
                  {question?.type === 'multiple' && question.options ? (
                    <select
                      value={currentValue}
                      onChange={(e) => handleEdit(match.questionId, e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select an answer...</option>
                      {question.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => handleEdit(match.questionId, e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      autoFocus
                    />
                  )}
                  <button
                    onClick={() => setEditingId(null)}
                    className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <div>
                    {currentValue ? (
                      <span className="text-sm text-gray-800">{currentValue}</span>
                    ) : (
                      <span className="text-sm text-red-600 italic">Not found - click edit to fill in</span>
                    )}
                    {wasEdited && (
                      <span className="ml-2 text-xs text-indigo-600 font-medium">(edited)</span>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingId(match.questionId)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Edit
                  </button>
                </div>
              )}

              {match.source && match.confidence > 0 && !isEditing && (
                <p className="text-xs text-gray-400 mt-1">{match.source}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleAccept}
          disabled={!allAnswered}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
        >
          Accept Answers
        </button>
      </div>
    </div>
  );
}
