import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bracket Anything - A Game of Pick \'Ems',
  description: 'Create and participate in fun bracket-style games and tournaments. Pick your favorites and see who comes out on top!',
  openGraph: {
    title: 'Bracket Anything - A Game of Pick \'Ems',
    description: 'Create and participate in fun bracket-style games and tournaments. Pick your favorites and see who comes out on top!',
    url: 'https://teddyrounds.com/bracket',
    siteName: 'Bracket Anything',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://teddyrounds.com/og.png',
        width: 1200,
        height: 630,
        alt: 'Bracket Anything - A Game of Pick \'Ems',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bracket Anything - A Game of Pick \'Ems',
    description: 'Create and participate in fun bracket-style games and tournaments. Pick your favorites and see who comes out on top!',
    images: ['https://teddyrounds.com/og.png'],
  },
};

export default function BracketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
