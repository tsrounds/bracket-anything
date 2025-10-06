'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface FannedCardsProps {
  frontSrc: string;
  backSrc: string;
  delayMs?: number;
  className?: string;
}

export default function FannedCards({ 
  frontSrc, 
  backSrc, 
  delayMs = 2000, 
  className = '' 
}: FannedCardsProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setShouldAnimate(true);
      return;
    }

    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs, shouldReduceMotion]);

  // Shared container dimensions - ensures both cards are identical size
  const cardContainerStyle = {
    width: '100%',
    height: '100%',
    position: 'absolute' as const,
    top: 0,
    left: 0,
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main container with fixed aspect ratio matching card dimensions (4500x6300) */}
      <div className="relative w-full max-w-sm mx-auto lg:mx-0 aspect-[3/4.2]">
        
        {/* Back card - positioned behind front card */}
        <motion.div
          className="absolute inset-0"
          initial={{ 
            x: 0, 
            y: 0, 
            rotate: 0,
            scale: 1,
            opacity: shouldReduceMotion ? 1 : 0.95, // Slightly transparent initially to avoid jerk
          }}
          animate={shouldAnimate ? { 
            // Responsive positioning: [mobile, desktop]
            x: [-30, -40], 
            y: [10, 14],   
            rotate: [-10, -12], 
            scale: 1,
            opacity: 1,
          } : { 
            x: 0, 
            y: 0, 
            rotate: 0,
            scale: 1,
            opacity: shouldReduceMotion ? 1 : 0.95,
          }}
          transition={{
            duration: 0.8,
            ease: [0.2, 0.8, 0.2, 1], // Smooth cubic-bezier
            delay: shouldAnimate ? 0.05 : 0, // Small delay to prevent jerk
          }}
          style={{
            transformOrigin: 'bottom left', // Natural fan-out pivot point
            zIndex: 1,
          }}
        >
          <div 
            className="rounded-lg overflow-hidden"
            style={{ 
              ...cardContainerStyle,
              filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))'
            }}
          >
            <Image
              src={backSrc}
              alt="Card back"
              fill
              className="object-cover"
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </motion.div>

        {/* Front card - positioned on top */}
        <motion.div
          className="absolute inset-0"
          initial={{ 
            rotate: 0,
            scale: 0.9,
            x: 0,
            y: 0,
          }}
          animate={shouldAnimate ? { 
            rotate: 6, // Counter-rotation for natural fan effect
            scale: 0.9,
            x: 0,
            y: 0,
          } : { 
            rotate: 0,
            scale: 0.9,
            x: 0,
            y: 0,
          }}
          transition={{
            duration: 0.8,
            ease: [0.2, 0.8, 0.2, 1], // Same timing as back card for synchronization
          }}
          style={{
            zIndex: 2, // Above back card
          }}
        >
          <div 
            className="rounded-lg overflow-hidden"
            style={{ 
              ...cardContainerStyle,
              filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))'
            }}
          >
            <Image
              src={frontSrc}
              alt="Card front"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}