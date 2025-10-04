'use client';

import { usePathname } from 'next/navigation';

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-900">
      {children}
    </div>
  );
} 