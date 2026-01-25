'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase/firebase-client';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthCheck from '../../../components/AuthCheck';
import ErrorBoundary from '../../../components/ErrorBoundary';
import AIQuizAssistantButton from '../../../components/predict-this/AIQuizAssistantButton';
import AIQuizModal from '../../../components/predict-this/AIQuizModal';
import type { AIGeneratedQuiz } from '../../../lib/predict-this/ai-schemas';

interface Question {
  id: string;
  type: 'multiple' | 'open';
  text: string;
  points: number;
  options?: string[];
}

interface QuizData {
  title: string;
  createdAt: string;
  status: 'in-progress' | 'completed';
  questions: Question[];
  coverImage?: string;
  deadline: string;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
}

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function CreateQuizContent() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([{
    id: '1',
    type: 'multiple',
    text: '',
    points: 1,
    options: ['', '']
  }]);
  const [coverImage, setCoverImage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Firebase client status:', {
        hasDb: !!db,
        dbType: typeof db,
        dbConstructor: db?.constructor?.name
      });
    }
  }, []);

  const handleAIQuizGenerated = (quiz: AIGeneratedQuiz) => {
    setTitle(quiz.title);
    // Convert ISO deadline to datetime-local format
    const deadlineDate = new Date(quiz.deadline);
    const localDeadline = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDeadline(localDeadline);
    // Map AI questions to our format
    setQuestions(quiz.questions.map((q, index) => ({
      id: String(index + 1),
      type: q.type,
      text: q.text,
      points: q.points,
      options: q.options || (q.type === 'multiple' ? ['', ''] : undefined),
    })));
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      id: String(questions.length + 1),
      type: 'multiple',
      text: '',
      points: 1,
      options: ['', '']
    }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options && q.options.length > 2) {
        const newOptions = [...q.options];
        newOptions.splice(optionIndex, 1);
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = 292;
      canvas.height = 208;

      if (ctx) {
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        setCoverImage(base64Image);
      }

      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Starting quiz creation...');

      // Manual validation
      if (!title.trim()) {
        throw new Error('Title is required');
      }

      if (!deadline) {
        throw new Error('Deadline is required');
      }

      // Validate questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text.trim()) {
          throw new Error(`Question ${i + 1} text is required`);
        }
        if (q.type === 'multiple' && q.options) {
          for (let j = 0; j < q.options.length; j++) {
            if (!q.options[j].trim()) {
              throw new Error(`Question ${i + 1}, Option ${j + 1} is required`);
            }
          }
        }
      }

      if (!db) {
        throw new Error('Firestore database not initialized');
      }

      let creatorId, creatorName, creatorAvatar;
      const { auth } = await import('../../../lib/firebase/firebase-client');
      const currentUser = auth.currentUser;

      if (currentUser) {
        creatorId = currentUser.uid;
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const profileRef = doc(db as any, 'userProfiles', currentUser.uid);
          const profileDoc = await getDoc(profileRef);
          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            creatorName = profileData.name;
            creatorAvatar = profileData.avatar;
          }
        } catch (error) {
          console.log('Could not fetch user profile, continuing without creator info');
        }
      }

      // Clean questions to remove undefined options
      const cleanedQuestions = questions.map(q => {
        const cleaned: any = {
          id: q.id,
          type: q.type,
          text: q.text,
          points: q.points,
        };
        if (q.type === 'multiple' && q.options) {
          cleaned.options = q.options;
        }
        return cleaned;
      });

      const quizData: QuizData = {
        title: title.trim(),
        createdAt: new Date().toISOString(),
        status: 'in-progress' as const,
        questions: cleanedQuestions,
        deadline: new Date(deadline).toISOString()
      };

      // Only add coverImage if it has a value
      if (coverImage) {
        quizData.coverImage = coverImage;
      }

      if (creatorId) {
        (quizData as any).creatorId = creatorId;
        if (creatorName) (quizData as any).creatorName = creatorName;
        if (creatorAvatar) (quizData as any).creatorAvatar = creatorAvatar;
      }

      console.log('Quiz data to be saved:', quizData);
      console.log('Attempting to save to Firestore...');

      if (typeof window === 'undefined') {
        throw new Error('Cannot create quiz on server side');
      }

      const quizzesCollection = collection(db, 'quizzes');
      const docRef = await addDoc(quizzesCollection, quizData);
      console.log('Quiz created successfully with ID:', docRef.id);

      // Record device fingerprint to link this UID to the device
      // This ensures quizzes appear in "My Quizzes" across sessions
      if (creatorId) {
        const { recordDeviceFingerprint } = await import('../../../lib/deviceFingerprint');
        await recordDeviceFingerprint(creatorId);
      }

      console.log('Redirecting to quizzes list...');
      router.push('/bracket/admin/quizzes');
    } catch (error) {
      console.error('Detailed error creating quiz:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      setError(error instanceof Error ? error.message : 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0f172A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white font-['PP_Object_Sans'] mb-2">
              Create New Quiz
            </h1>
            <p className="text-white/60 font-['PP_Object_Sans']">
              Build your own prediction challenge
            </p>
          </motion.div>

          {/* AI Assistant Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <AIQuizAssistantButton onClick={() => setIsAIModalOpen(true)} />
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/40 text-sm font-['PP_Object_Sans']">or create manually</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
          >
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 mb-6">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-400 font-['PP_Object_Sans']">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Quiz Title */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 font-['PP_Object_Sans']">
                  Quiz Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 font-['PP_Object_Sans'] focus:outline-none focus:border-[#F58143] transition-colors"
                  placeholder="Enter quiz title"
                  disabled={isSubmitting}
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 font-['PP_Object_Sans']">
                  Cover Image (Optional)
                </label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
                  <div className="text-center">
                    {coverImage ? (
                      <div className="relative w-[292px] h-52 mx-auto">
                        <img
                          src={coverImage}
                          alt="Quiz cover preview"
                          className="rounded-lg object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => setCoverImage('')}
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-1.5 transition-colors"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mx-auto h-12 w-12 text-white/30"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="mt-4">
                          <label className="cursor-pointer">
                            <span className="text-[#F58143] hover:text-[#ff9a5c] font-medium font-['PP_Object_Sans'] transition-colors">
                              Upload a file
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageUpload}
                            />
                          </label>
                          <span className="text-white/40 font-['PP_Object_Sans']"> or drag and drop</span>
                        </div>
                        <p className="text-xs text-white/30 mt-2 font-['PP_Object_Sans']">
                          Recommended: 292x208 pixels
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 font-['PP_Object_Sans']">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-['PP_Object_Sans'] focus:outline-none focus:border-[#F58143] transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white font-['PP_Object_Sans']">
                    Questions
                  </h2>
                  <span className="text-white/40 text-sm font-['PP_Object_Sans']">
                    {questions.length} question{questions.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-4"
                >
                  {questions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      variants={staggerItem}
                      className="bg-white/5 border border-white/10 rounded-xl p-5"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white font-['PP_Object_Sans']">
                          Question {index + 1}
                        </h3>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(question.id)}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors font-['PP_Object_Sans']"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Type and Points */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white/60 mb-1 font-['PP_Object_Sans']">
                              Type
                            </label>
                            <select
                              value={question.type}
                              onChange={(e) => updateQuestion(question.id, {
                                type: e.target.value as 'multiple' | 'open',
                                options: e.target.value === 'multiple' ? ['', ''] : undefined
                              })}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-['PP_Object_Sans'] focus:outline-none focus:border-[#F58143]"
                            >
                              <option value="multiple" className="bg-[#1e293b]">Multiple Choice</option>
                              <option value="open" className="bg-[#1e293b]">Open Ended</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white/60 mb-1 font-['PP_Object_Sans']">
                              Points
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              max="10"
                              value={question.points}
                              onChange={(e) => updateQuestion(question.id, { points: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-['PP_Object_Sans'] focus:outline-none focus:border-[#F58143]"
                            />
                          </div>
                        </div>

                        {/* Question Text */}
                        <div>
                          <label className="block text-sm font-medium text-white/60 mb-1 font-['PP_Object_Sans']">
                            Question Text
                          </label>
                          <textarea
                            required
                            value={question.text}
                            onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-['PP_Object_Sans'] focus:outline-none focus:border-[#F58143] resize-none"
                            rows={2}
                            placeholder="Enter your prediction question..."
                          />
                        </div>

                        {/* Multiple Choice Options */}
                        {question.type === 'multiple' && Array.isArray(question.options) && (
                          <div className="bg-white/5 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-white/60 mb-2 font-['PP_Object_Sans']">
                              Answer Options
                            </label>
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-2">
                                  <input
                                    type="text"
                                    required
                                    value={option}
                                    onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-['PP_Object_Sans'] focus:outline-none focus:border-[#F58143]"
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                  {question.options && question.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(question.id, optionIndex)}
                                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOption(question.id)}
                                className="mt-2 text-sm text-[#38bdf8] hover:text-[#56c8fa] font-medium font-['PP_Object_Sans'] flex items-center gap-1 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Option
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Open Ended Preview */}
                        {question.type === 'open' && (
                          <div className="bg-white/5 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-white/60 mb-2 font-['PP_Object_Sans']">
                              Answer Preview
                            </label>
                            <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/30 font-['PP_Object_Sans']">
                              Players will type their prediction here...
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Add Question Button */}
                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 font-['PP_Object_Sans'] flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </button>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
                className="w-full py-4 bg-gradient-to-r from-[#38bdf8] to-[#56c8fa] text-white text-lg font-semibold rounded-xl hover:shadow-lg hover:shadow-[#38bdf8]/20 disabled:opacity-50 disabled:cursor-not-allowed font-['PP_Object_Sans'] transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Quiz...
                  </span>
                ) : (
                  'Create Quiz'
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* AI Modal */}
        <AIQuizModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onQuizGenerated={handleAIQuizGenerated}
        />
      </div>
    </ErrorBoundary>
  );
}

export default function CreateQuiz() {
  return (
    <AuthCheck>
      <CreateQuizContent />
    </AuthCheck>
  );
}
