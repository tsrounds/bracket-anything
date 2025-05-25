import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Predict This.',
  description: 'a game of pick \'ems',
  metadataBase: new URL('https://teddyrounds.com'),
  openGraph: {
    title: 'Predict This.',
    description: 'a game of pick \'ems',
    url: 'https://teddyrounds.com',
    siteName: 'Predict This.',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://teddyrounds.com/og.png',
        width: 1200,
        height: 630,
        alt: 'Predict This.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Predict This.',
    description: 'a game of pick \'ems',
    images: ['https://teddyrounds.com/og.png'],
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
