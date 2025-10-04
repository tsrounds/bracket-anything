'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          Theodore Rounds
        </h1>
        <p className="text-xl mb-8 text-gray-600">
          Software Developer & Creative Technologist
        </p>
        
        <div className="space-y-4 mb-12">
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Welcome to my personal homepage. I build web applications, 
            experiment with new technologies, and create interactive experiences.
          </p>
        </div>

        <div className="space-y-4">
          <Link 
            href="/bracket" 
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            Try Bracket Anything
          </Link>
          
          <div className="text-sm text-gray-500 mt-4">
            <p>A tournament-style prediction game built with Next.js and Firebase</p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Web Development</h3>
            <p className="text-gray-600 text-sm">
              Full-stack applications with React, Next.js, and modern web technologies
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Interactive Design</h3>
            <p className="text-gray-600 text-sm">
              Engaging user experiences with animations and creative interfaces
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Cloud & APIs</h3>
            <p className="text-gray-600 text-sm">
              Scalable backend solutions with Firebase, Vercel, and cloud services
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}