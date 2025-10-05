'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem, hoverLift } from '../../../lib/motion';

const articles = [
  {
    id: 1,
    title: 'Building Scalable React Applications with TypeScript',
    excerpt: 'Learn how to structure large React applications using TypeScript, proper state management, and modern development practices.',
    date: '2024-01-15',
    readTime: '8 min read',
    category: 'Development',
    featured: true,
  },
  {
    id: 2,
    title: 'The Future of Web Development: Trends to Watch in 2024',
    excerpt: 'Exploring emerging technologies and trends that will shape the web development landscape in the coming year.',
    date: '2024-01-08',
    readTime: '6 min read',
    category: 'Technology',
    featured: true,
  },
  {
    id: 3,
    title: 'Optimizing Performance in Next.js Applications',
    excerpt: 'A comprehensive guide to improving performance in Next.js applications through code splitting, image optimization, and more.',
    date: '2023-12-20',
    readTime: '10 min read',
    category: 'Performance',
    featured: false,
  },
  {
    id: 4,
    title: 'Design Systems: Creating Consistent User Experiences',
    excerpt: 'How to build and maintain design systems that ensure consistency across your applications and improve developer productivity.',
    date: '2023-12-10',
    readTime: '7 min read',
    category: 'Design',
    featured: false,
  },
];

const categories = ['All', 'Development', 'Technology', 'Performance', 'Design'];

export default function Writing() {
  const featuredArticles = articles.filter(article => article.featured);
  const otherArticles = articles.filter(article => !article.featured);

  return (
    <section className="py-20 bg-white">
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
              Writing
            </span>
          </motion.div>
          
          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6"
          >
            Thoughts &{' '}
            <span className="text-gradient">insights</span>
          </motion.h2>
          
          <motion.p
            variants={fadeInUp}
            className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8"
          >
            Sharing my experiences, learnings, and insights about web development, 
            technology trends, and the ever-evolving digital landscape.
          </motion.p>

          {/* Category Filter */}
          <motion.div
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-2"
          >
            {categories.map((category) => (
              <motion.button
                key={category}
                variants={staggerItem}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  category === 'All'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-primary-100 hover:text-primary-700'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Featured Articles */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-20"
        >
          <motion.h3
            variants={fadeInUp}
            className="text-3xl font-bold text-neutral-900 text-center mb-12"
          >
            Featured Articles
          </motion.h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredArticles.map((article, index) => (
              <motion.article
                key={article.id}
                variants={staggerItem}
                whileHover="hover"
                className="group cursor-pointer"
              >
                <motion.div
                  variants={hoverLift}
                  className="bg-white rounded-2xl shadow-soft p-8 border border-neutral-100 h-full"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      {article.category}
                    </span>
                    <span className="text-neutral-400 text-sm">•</span>
                    <span className="text-neutral-500 text-sm">{article.readTime}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4 group-hover:text-primary-600 transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-neutral-600 mb-6 leading-relaxed">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 text-sm">
                      {new Date(article.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    
                    <div className="flex items-center text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
                      Read More
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </motion.article>
            ))}
          </div>
        </motion.div>

        {/* Other Articles */}
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
            More Articles
          </motion.h3>
          
          <div className="space-y-6">
            {otherArticles.map((article, index) => (
              <motion.article
                key={article.id}
                variants={staggerItem}
                whileHover="hover"
                className="group cursor-pointer"
              >
                <motion.div
                  variants={hoverLift}
                  className="bg-white rounded-xl shadow-soft p-6 border border-neutral-100"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                          {article.category}
                        </span>
                        <span className="text-neutral-400 text-xs">•</span>
                        <span className="text-neutral-500 text-xs">{article.readTime}</span>
                      </div>
                      
                      <h4 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {article.title}
                      </h4>
                      
                      <p className="text-neutral-600 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end mt-4 md:mt-0 md:ml-6">
                      <span className="text-neutral-500 text-sm">
                        {new Date(article.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      
                      <div className="flex items-center text-primary-600 font-semibold group-hover:text-primary-700 transition-colors ml-4">
                        Read
                        <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.article>
            ))}
          </div>
        </motion.div>

        {/* Newsletter CTA */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-20 text-center"
        >
          <motion.div
            variants={fadeInUp}
            className="bg-gradient-to-r from-primary-600 to-accent-500 rounded-2xl p-8 md:p-12 text-white"
          >
            <h3 className="text-3xl font-bold mb-4">
              Stay Updated
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Get notified when I publish new articles and insights about web development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-neutral-100 transition-colors">
                Subscribe
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}