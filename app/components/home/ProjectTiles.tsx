'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface Project {
  name: string;
  description: string;
  image: string;
  href: string;
  external?: boolean;
  ctaText?: string;
}

const projects: Project[] = [
  {
    name: 'Predict this',
    description: 'Easy to make, share and score prediction challenges. Oscars challenge? Got it. Champions league results? Yup. Which Real Housewives of Salt Lake leaves the show first? Sure.',
    image: '/animations/totalgif.gif',
    href: '/bracket',
    ctaText: 'Try it now',
  },
  {
    name: 'Red Rising Playing Cards',
    description: 'Custom designed playing cards inspired by Pierce Brown\'s Red Rising series. Currently designing a full 52-card deck.',
    image: '/images/Front%20Face.png',
    href: '#red-rising',
    ctaText: 'Learn more',
  },
];

export default function ProjectTiles() {
  const handleClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href === '#red-rising' ? 'section' : href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="project-tiles" className="py-20 bg-[#EEDDAB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {projects.map((project, index) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Link
                href={project.href}
                onClick={(e) => handleClick(project.href, e)}
                className="block group"
              >
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 h-full"
                >
                  {/* Image */}
                  <div className="relative h-64 bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.name}
                      fill
                      unoptimized={project.image.endsWith('.gif')}
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className={`text-2xl ${project.name === 'Predict this' ? 'font-changa' : 'font-plush'} font-bold text-neutral-900 mb-3 group-hover:text-[#003566] transition-colors duration-300`}>
                      {project.name}
                    </h3>
                    <p className="text-neutral-600 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="px-6 pb-6">
                    <div className="flex items-center text-[#003566] font-semibold group-hover:translate-x-2 transition-transform duration-300">
                      <span>{project.ctaText || 'Explore'}</span>
                      <svg
                        className="w-5 h-5 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
