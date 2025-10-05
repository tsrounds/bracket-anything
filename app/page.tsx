'use client';

import Hero from './components/home/Hero';
import RedRising from './components/home/RedRising';
import Projects from './components/home/Projects';
import Experience from './components/home/Experience';
import Writing from './components/home/Writing';
import CTA from './components/home/CTA';
import Footer from './components/home/Footer';

export default function Home() {
  return (
    <main>
      <Hero />
      <RedRising />
      <Projects />
      <Experience />
      <Writing />
      <CTA />
      <Footer />
    </main>
  );
}