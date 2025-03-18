import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bracket Anything | Create and Share Quizzes',
  description: 'Create, share, and participate in interactive quizzes. A modern platform for engaging with your audience through fun and interactive content.',
  metadataBase: new URL('https://teddyrounds.com'),
  openGraph: {
    title: 'Bracket Anything | Create and Share Quizzes',
    description: 'Create, share, and participate in interactive quizzes. A modern platform for engaging with your audience through fun and interactive content.',
    url: 'https://teddyrounds.com',
    siteName: 'Bracket Anything',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bracket Anything | Create and Share Quizzes',
    description: 'Create, share, and participate in interactive quizzes. A modern platform for engaging with your audience through fun and interactive content.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
