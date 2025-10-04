'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthCheck from '../../components/AuthCheck';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  console.log('AdminPage rendering');
  
  return (
    <AuthCheck>
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Admin Dashboard
          </h1>
          <div className="space-y-4">
            <Link href="/bracket/admin/create-quiz">
              <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                Create Quiz
              </button>
            </Link>
            <Link href="/bracket/admin/quizzes">
              <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200">
                View Quizzes
              </button>
            </Link>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
} 