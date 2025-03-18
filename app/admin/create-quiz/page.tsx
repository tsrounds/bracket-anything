'use client';

import { useState } from 'react';
import { db } from '../../lib/firebase/firebase-client';
import { collection, addDoc, getDocs, query, orderBy, startAt, endAt, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import AuthCheck from '../../components/AuthCheck';

interface Question {
  id: string;
  type: 'multiple' | 'open';
  text: string;
  points: number;
  options?: string[];
}

function CreateQuizContent() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([{
    id: '1',
    type: 'multiple',
    text: '',
    points: 0,
    options: ['', '']
  }]);
  const [coverImage, setCoverImage] = useState<string>('');

  const addQuestion = () => {
    setQuestions([...questions, {
      id: String(questions.length + 1),
      type: 'multiple',
      text: '',
      points: 0,
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

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Check dimensions and format image before setting
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Create a canvas to resize the image if needed
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set target dimensions (292x208)
      canvas.width = 292;
      canvas.height = 208;

      if (ctx) {
        // Draw image with cover behavior
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Convert to base64
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
    console.log('Starting quiz submission...');

    try {
      // Validate required fields
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      if (!deadline) {
        throw new Error('Deadline is required');
      }

      // Create a URL-friendly version of the title for the document ID
      const baseId = title.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric characters with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

      // Get all existing documents that start with this base ID
      const existingDocs = await getDocs(
        query(
          collection(db, 'quizzes'),
          orderBy('title'),
          startAt(title),
          endAt(title + '\uf8ff')
        )
      );

      // Determine the next available number suffix (if needed)
      let documentId = baseId;
      const existingIds = new Set(existingDocs.docs.map(doc => doc.id));
      
      if (existingIds.has(documentId)) {
        let counter = 1;
        while (existingIds.has(`${baseId}-${counter}`)) {
          counter++;
        }
        documentId = `${baseId}-${counter}`;
      }

      // Log the data being sent
      const quizData = {
        title,
        deadline: new Date(deadline).toISOString(),
        questions,
        coverImage,
        createdAt: new Date().toISOString(),
        status: 'in-progress'
      };
      console.log('Quiz data to be saved:', quizData);

      // Create the quiz document with the custom ID
      const docRef = doc(db, 'quizzes', documentId);
      await setDoc(docRef, quizData);
      console.log('Quiz created successfully with ID:', documentId);

      router.push('/admin/quizzes');
    } catch (error) {
      console.error('Detailed error information:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      alert(error instanceof Error ? error.message : 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New Quiz</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
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
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
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
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Recommended size: 292x208 pixels (will be resized if larger)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Questions Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Questions</h2>
              {questions.map((question, index) => (
                <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Question {index + 1}</h3>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-all"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          value={question.type}
                          onChange={(e) => updateQuestion(question.id, { 
                            type: e.target.value as 'multiple' | 'open',
                            options: e.target.value === 'multiple' ? ['', ''] : undefined
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="multiple">Multiple Choice</option>
                          <option value="open">Open Ended</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Points</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={question.points}
                          onChange={(e) => updateQuestion(question.id, { points: Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Question Text</label>
                      <textarea
                        required
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        rows={2}
                      />
                    </div>

                    {question.type === 'multiple' && Array.isArray(question.options) && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <input
                                type="text"
                                required
                                value={option}
                                onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              {question.options && question.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(question.id, optionIndex)}
                                  className="px-2 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(question.id)}
                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium inline-flex items-center"
                          >
                            <span className="mr-1">+</span> Add Option
                          </button>
                        </div>
                      </div>
                    )}

                    {question.type === 'open' && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Answer Preview</label>
                        <textarea
                          disabled
                          placeholder="Students will type their answer here"
                          className="w-full rounded-md border-gray-300 bg-white text-sm"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Question
              </button>
            </div>

            <div className="pt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateQuiz() {
  return (
    <AuthCheck>
      <CreateQuizContent />
    </AuthCheck>
  );
} 