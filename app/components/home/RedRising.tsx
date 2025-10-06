'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import ReserveDeckModal from '../ReserveDeckModal';
import FannedCards from '../red-rising/FannedCards';

export default function RedRising() {
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  return (
    <section className="bg-red-rising-dark text-white relative" style={{ backgroundColor: '#001d3d' }}>
      {/* Main content */}
      <div className="container mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Playing card image */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <div className="relative -mt-20 lg:-mt-32" style={{ transform: 'translateY(-30px) translateX(80px)' }}>
              <FannedCards
                frontSrc="/images/Front%20Face.png"
                backSrc="/images/Face%20Card.png"
                delayMs={2000}
                className="w-full"
              />
            </div>
          </motion.div>

          {/* Right side - Text content */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="font-plush font-black text-3xl lg:text-4xl xl:text-5xl leading-tight text-white">
              RED RISING PLAYING CARDS
            </h2>
            
            <p className="font-plush font-normal text-lg lg:text-xl leading-relaxed text-white">
              I have spent way too much time designing 2 of the 52 cards needed for a full playing card deck. 
              If enough people say they are interested, I will spend an obscene amount of more time finishing 
              the remaining cards. By 'enough people' I mean literally 6 people to cover the costs.
            </p>
            
            <p className="font-plush font-normal text-lg text-white">
              Estimated price: $40?
            </p>
            
            <motion.button 
              className="border-2 text-white font-plush font-bold px-8 py-4 text-lg uppercase tracking-wide hover:bg-red-rising-orange hover:text-red-rising-dark transition-all duration-300 rounded-lg"
              style={{ 
                backgroundColor: '#003566',
                borderColor: '#ffc300'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsReserveOpen(true)}
            >
              RESERVE A DECK
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Bottom banner */}
      <motion.div 
        className="py-8 overflow-hidden"
        style={{ backgroundColor: '#003566' }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
        viewport={{ once: true }}
      >
        <div className="relative w-full overflow-hidden">
          <div 
            className="flex whitespace-nowrap"
            style={{
              animation: 'scroll 41.5s linear infinite',
              width: '200%'
            }}
          >
            <div className="flex items-center space-x-8 text-white font-plush text-lg lg:text-xl min-w-max">
              <span className="font-bold text-xl lg:text-2xl">FAQs</span>
              <span>•</span>
              <span><span className="font-black">So why does it take me so long?</span> &nbsp;&nbsp;idk, I think I'm just really inefficient?</span>
              <span>•</span>
              <span><span className="font-black">Then why am I doing this?</span> &nbsp;&nbsp;It is fun for me and I really like Red Rising.</span>
              <span>•</span>
              <span><span className="font-black">Is this for real?</span> &nbsp;&nbsp;I think so.</span>
              <span>•</span>
              <span><span className="font-black">When can I expect to get the cards?</span> &nbsp;&nbsp;My average turnaround time for creative work is 3-32 weeks.</span>
              <span>•</span>
              <span><span className="font-black">So why does it take me so long?</span> &nbsp;&nbsp;idk, I think I'm just really inefficient?</span>
              <span>•</span>
              <span><span className="font-black">Then why am I doing this?</span> &nbsp;&nbsp;It is fun for me and I really like Red Rising.</span>
              <span>•</span>
              <span><span className="font-black">Is this for real?</span> &nbsp;&nbsp;I think so.</span>
              <span>•</span>
              <span><span className="font-black">When can I expect to get the cards?</span> &nbsp;&nbsp;My average turnaround time for creative work is 3-32 weeks.</span>
            </div>
          </div>
        </div>
      </motion.div>
      <ReserveDeckModal isOpen={isReserveOpen} onClose={() => setIsReserveOpen(false)} />
    </section>
  );
}
