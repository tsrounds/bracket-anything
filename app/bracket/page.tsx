'use client';

import Link from 'next/link';

export default function BracketHome() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-4xl font-bold mb-8">Welcome to Bracket Anything</h1>
        <p className="text-xl mb-8">Your new project is ready to go!</p>
        <Link 
          href="/bracket/admin" 
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Admin Dashboard
        </Link>
      </div>
    </main>
  );
}