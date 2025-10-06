'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem, hoverLift } from '../../../lib/motion';
import Image from 'next/image';

export default function Projects() {

  return (
    <section id="projects" className="py-20" style={{ backgroundColor: '#EEDDAB' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-plush font-black text-black mb-6"
          >
            I've done this before (kind of)
          </motion.h2>
          
          <motion.p
            variants={fadeInUp}
            className="text-xl text-black max-w-3xl mx-auto mb-24"
          >
            I have made two decks of cards before, both of which have received 100% satisfaction ratings from my wife and the small gaggle of friends I've shown them to.
          </motion.p>
        </motion.div>

        {/* Card Decks */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20"
        >
          {/* Card Deck 1 */}
          <motion.div
            variants={staggerItem}
            whileHover="hover"
            className="group"
          >
            <motion.div
              variants={hoverLift}
              className="bg-white rounded-2xl shadow-soft overflow-visible border border-neutral-100 relative max-w-sm mx-auto"
            >
              {/* Joker image positioned to extend above the white card */}
              <div 
                className="relative w-full max-w-[12.5rem] mx-auto aspect-[3/4.2] -mt-16 overflow-hidden rounded-lg"
                style={{ 
                  filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                }}
              >
                <Image
                  src="/images/joker 1.png"
                  alt="Anniversary Deck Card"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              
              <div className="p-8 pt-4">
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  Anniversary Deck
                </h3>
                
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  A custom deck that only took me ~9 months of free time to make.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Card Deck 2 */}
          <motion.div
            variants={staggerItem}
            whileHover="hover"
            className="group"
          >
            <motion.div
              variants={hoverLift}
              className="bg-white rounded-2xl shadow-soft overflow-visible border border-neutral-100 relative max-w-sm mx-auto"
            >
              {/* Joker image positioned to extend above the white card */}
              <div 
                className="relative w-full max-w-[12.5rem] mx-auto aspect-[3/4.2] -mt-16 overflow-hidden rounded-lg"
                style={{ 
                  filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                }}
              >
                <Image
                  src="/images/joker 2.png"
                  alt="Cambio Card"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              
              <div className="p-8 pt-4">
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  Cambio
                </h3>
                
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  Inarguably the best card game that exists. Message if you're interested 👀
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Email Button */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center"
        >
          <motion.button
            variants={fadeInUp}
            className="inline-flex items-center gap-3 text-white font-plush font-bold px-8 py-4 text-lg uppercase tracking-wide hover:bg-red-rising-orange hover:text-red-rising-dark transition-all duration-300 rounded-lg"
            style={{ 
              backgroundColor: '#003566'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open('mailto:hello@teddyrounds.com', '_blank')}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
            me
          </motion.button>
        </motion.div>

      </div>
    </section>
  );
}