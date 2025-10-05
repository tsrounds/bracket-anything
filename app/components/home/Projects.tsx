'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem, hoverLift } from '../../../lib/motion';
import Link from 'next/link';
import Image from 'next/image';

const projects = [
  {
    id: 1,
    title: 'Bracket Anything',
    description: 'A tournament-style prediction game built with Next.js, Firebase, and real-time updates. Features user authentication, bracket creation, and live scoring.',
    image: '/placeholder-quiz.png',
    tags: ['Next.js', 'Firebase', 'TypeScript', 'Tailwind CSS'],
    link: '/bracket',
    featured: true,
  },
  {
    id: 2,
    title: 'Portfolio Website',
    description: 'A modern, responsive portfolio website showcasing my work and skills. Built with Next.js, Framer Motion, and Tailwind CSS.',
    image: '/placeholder-quiz.png',
    tags: ['Next.js', 'Framer Motion', 'Tailwind CSS', 'TypeScript'],
    link: '#',
    featured: true,
  },
  {
    id: 3,
    title: 'E-commerce Platform',
    description: 'A full-stack e-commerce solution with user authentication, payment processing, and inventory management.',
    image: '/placeholder-quiz.png',
    tags: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    link: '#',
    featured: false,
  },
  {
    id: 4,
    title: 'Task Management App',
    description: 'A collaborative task management application with real-time updates, team collaboration, and project tracking.',
    image: '/placeholder-quiz.png',
    tags: ['React', 'Socket.io', 'Express', 'PostgreSQL'],
    link: '#',
    featured: false,
  },
];

export default function Projects() {
  const featuredProjects = projects.filter(project => project.featured);
  const otherProjects = projects.filter(project => !project.featured);

  return (
    <section id="projects" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.div variants={staggerItem} className="mb-4">
            <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              Featured Work
            </span>
          </motion.div>
          
          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6"
          >
            Projects I'm{' '}
            <span className="text-gradient">proud of</span>
          </motion.h2>
          
          <motion.p
            variants={fadeInUp}
            className="text-xl text-neutral-600 max-w-3xl mx-auto"
          >
            A collection of projects that showcase my skills in full-stack development, 
            user experience design, and modern web technologies.
          </motion.p>
        </motion.div>

        {/* Featured Projects */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20"
        >
          {featuredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              variants={staggerItem}
              whileHover="hover"
              className="group"
            >
              <motion.div
                variants={hoverLift}
                className="bg-white rounded-2xl shadow-soft overflow-hidden border border-neutral-100"
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                    {project.title}
                  </h3>
                  
                  <p className="text-neutral-600 mb-6 leading-relaxed">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <Link
                    href={project.link}
                    className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                  >
                    View Project
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Other Projects */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h3
            variants={fadeInUp}
            className="text-3xl font-bold text-neutral-900 text-center mb-12"
          >
            More Projects
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherProjects.map((project, index) => (
              <motion.div
                key={project.id}
                variants={staggerItem}
                whileHover="hover"
                className="group"
              >
                <motion.div
                  variants={hoverLift}
                  className="bg-white rounded-xl shadow-soft p-6 border border-neutral-100"
                >
                  <h4 className="text-xl font-bold text-neutral-900 mb-3">
                    {project.title}
                  </h4>
                  
                  <p className="text-neutral-600 mb-4 leading-relaxed">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <Link
                    href={project.link}
                    className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors text-sm"
                  >
                    View Project
                    <svg className="ml-2 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}