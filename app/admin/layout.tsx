'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import AuthCheck with no SSR
const AuthCheck = dynamic(() => import('../components/AuthCheck'), {
  ssr: false
});

// Dynamically import ErrorBoundary with no SSR
const ErrorBoundary = dynamic(() => import('../components/ErrorBoundary'), {
  ssr: false
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('AdminLayout rendering');
  
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        <AuthCheck>{children}</AuthCheck>
      </Suspense>
    </ErrorBoundary>
  );
} 