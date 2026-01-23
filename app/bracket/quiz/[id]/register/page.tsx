'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuizRegistration({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to quiz take page - registration now happens on submit
    router.replace(`/bracket/quiz/${params.id}/take`);
  }, [params.id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e162a]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
    </div>
  );
} 