import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Changa_One } from 'next/font/google';
import SiteNav from './components/SiteNav';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const changaOne = Changa_One({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-changa-one',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'Theodore Rounds - Full-Stack Developer',
  description: 'Full-stack developer crafting beautiful, functional web applications with modern technologies and thoughtful design.',
  metadataBase: new URL('https://teddyrounds.com'),
  openGraph: {
    title: 'Theodore Rounds - Full-Stack Developer',
    description: 'Full-stack developer crafting beautiful, functional web applications with modern technologies and thoughtful design.',
    url: 'https://teddyrounds.com',
    siteName: 'Theodore Rounds',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://teddyrounds.com/og.png',
        width: 1200,
        height: 630,
        alt: 'Theodore Rounds - Full-Stack Developer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Theodore Rounds - Full-Stack Developer',
    description: 'Full-stack developer crafting beautiful, functional web applications with modern technologies and thoughtful design.',
    images: ['https://teddyrounds.com/og.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${changaOne.variable}`}>
      <body className="font-sans antialiased">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
