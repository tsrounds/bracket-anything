'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../../lib/motion';

const experiences = [
  {
    id: 1,
    title: 'Full-Stack Developer',
    company: 'Freelance',
    period: '2021 - Present',
    description: 'Building custom web applications for clients across various industries. Specializing in React, Next.js, and modern web technologies.',
    achievements: [
      'Delivered 20+ successful projects for diverse clients',
      'Achieved 100% client satisfaction rate',
      'Reduced average project delivery time by 30%',
      'Implemented modern development practices and CI/CD pipelines'
    ],
    current: true,
  },
  {
    id: 2,
    title: 'Frontend Developer',
    company: 'Tech Startup',
    period: '2020 - 2021',
    description: 'Developed user-facing features for a fast-growing SaaS platform. Collaborated with design and backend teams to deliver exceptional user experiences.',
    achievements: [
      'Built responsive components used by 10,000+ users',
      'Improved page load times by 40% through optimization',
      'Mentored junior developers and established coding standards',
      'Led the migration from legacy jQuery to React'
    ],
    current: false,
  },
  {
    id: 3,
    title: 'Web Developer Intern',
    company: 'Digital Agency',
    period: '2019 - 2020',
    description: 'Gained hands-on experience in web development while working on client projects. Learned modern frameworks and best practices.',
    achievements: [
      'Contributed to 15+ client websites and applications',
      'Learned React, Node.js, and modern development tools',
      'Collaborated with senior developers on complex features',
      'Maintained and updated existing client websites'
    ],
    current: false,
  },
];

const skills = [
  { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'] },
  { category: 'Backend', items: ['Node.js', 'Express', 'Firebase', 'PostgreSQL', 'MongoDB'] },
  { category: 'Tools', items: ['Git', 'Docker', 'Vercel', 'AWS', 'Figma'] },
  { category: 'Languages', items: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML/CSS'] },
];

export default function Experience() {
  return (
    <section className="py-20 bg-neutral-50">
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
              Experience
            </span>
          </motion.div>
          
          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6"
          >
            My{' '}
            <span className="text-gradient">journey</span>
          </motion.h2>
          
          <motion.p
            variants={fadeInUp}
            className="text-xl text-neutral-600 max-w-3xl mx-auto"
          >
            From intern to full-stack developer, I've been building digital experiences 
            and growing my skills in the ever-evolving world of web development.
          </motion.p>
        </motion.div>

        {/* Experience Timeline */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="relative"
        >
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 to-primary-400 hidden md:block" />
          
          <div className="space-y-12">
            {experiences.map((experience, index) => (
              <motion.div
                key={experience.id}
                variants={staggerItem}
                className="relative flex items-start"
              >
                {/* Timeline dot */}
                <div className="hidden md:flex absolute left-6 w-4 h-4 bg-primary-600 rounded-full border-4 border-white shadow-medium z-10" />
                
                <div className="md:ml-16 bg-white rounded-2xl shadow-soft p-8 border border-neutral-100 w-full">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900 mb-1">
                        {experience.title}
                      </h3>
                      <p className="text-lg text-primary-600 font-semibold">
                        {experience.company}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium">
                        {experience.period}
                      </span>
                      {experience.current && (
                        <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-neutral-600 mb-6 leading-relaxed">
                    {experience.description}
                  </p>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-900 mb-3">
                      Key Achievements:
                    </h4>
                    <ul className="space-y-2">
                      {experience.achievements.map((achievement, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg className="w-5 h-5 text-success-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-neutral-600">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Skills Section */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-20"
        >
          <motion.h3
            variants={fadeInUp}
            className="text-3xl font-bold text-neutral-900 text-center mb-12"
          >
            Skills & Technologies
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {skills.map((skillGroup, index) => (
              <motion.div
                key={skillGroup.category}
                variants={staggerItem}
                className="bg-white rounded-xl shadow-soft p-6 border border-neutral-100"
              >
                <h4 className="text-lg font-bold text-neutral-900 mb-4 text-center">
                  {skillGroup.category}
                </h4>
                <div className="space-y-2">
                  {skillGroup.items.map((skill) => (
                    <div
                      key={skill}
                      className="px-3 py-2 bg-neutral-50 text-neutral-700 rounded-lg text-sm font-medium text-center"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}