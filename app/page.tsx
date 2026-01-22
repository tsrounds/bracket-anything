'use client';

import Hero from './components/home/Hero';
import RedRising from './components/home/RedRising';
import ProjectTiles from './components/home/ProjectTiles';
import Projects from './components/home/Projects';
import Footer from './components/home/Footer';

export default function Home() {
  return (
    <main>
      <Hero />
      <RedRising />
      <ProjectTiles />
      <Projects />
      <Footer />
    </main>
  );
}