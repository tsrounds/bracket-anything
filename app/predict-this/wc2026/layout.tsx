import { ReactNode } from 'react';

export default function Wc2026Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {children}
    </div>
  );
}
