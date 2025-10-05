'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef, useCallback } from 'react';

export default function Hero() {
  const eyeRef = useRef<HTMLDivElement>(null);
  const isMouseTracking = useRef(true);

  // Motion values for smooth cursor tracking
  const leftPupilX = useMotionValue(0);
  const leftPupilY = useMotionValue(0);
  const rightPupilX = useMotionValue(0);
  const rightPupilY = useMotionValue(0);
  
  // Spring animations for organic movement
  const springLeftX = useSpring(leftPupilX, { stiffness: 300, damping: 30 });
  const springLeftY = useSpring(leftPupilY, { stiffness: 300, damping: 30 });
  const springRightX = useSpring(rightPupilX, { stiffness: 300, damping: 30 });
  const springRightY = useSpring(rightPupilY, { stiffness: 300, damping: 30 });

  // Mouse move handler with proper eye positioning
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseTracking.current || !eyeRef.current) return;

    const rect = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;
    
    // Mouse position relative to eye center
    const mouseX = e.clientX - eyeCenterX;
    const mouseY = e.clientY - eyeCenterY;
    
    // Eye dimensions
    const eyeWidth = rect.width;
    const eyeHeight = rect.height;
    const tenthWidth = eyeWidth / 10; // Much smaller movement range for closer pupils
    
    // Y-axis movement (same for both pupils, looking up by default)
    const baseY = -eyeHeight * 0.15; // Start looking up, positioned higher in oval
    const maxYMovement = eyeHeight * 0.3; // Allow more vertical movement
    // When cursor is above eyes (negative mouseY), pupils should look up more (more negative Y)
    // When cursor is below eyes (positive mouseY), pupils should look down (less negative Y)
    // Allow pupils to move from baseY up to baseY - maxYMovement (looking up) and baseY + maxYMovement (looking down)
    const clampedY = Math.max(baseY - maxYMovement, Math.min(baseY + maxYMovement, baseY + mouseY * 0.4));
    
    // X-axis movement (pupils much closer together)
    const maxXMovement = tenthWidth * 3; // Allow more horizontal movement
    
    // Left pupil: moves within small range around 40% position
    const leftPupilXPos = Math.max(-tenthWidth - maxXMovement, Math.min(-tenthWidth + maxXMovement, -tenthWidth + mouseX * 0.4));
    
    // Right pupil: moves within small range around 60% position  
    const rightPupilXPos = Math.max(tenthWidth - maxXMovement, Math.min(tenthWidth + maxXMovement, tenthWidth + mouseX * 0.4));
    
    // Update pupil positions
    leftPupilX.set(leftPupilXPos);
    leftPupilY.set(clampedY);
    rightPupilX.set(rightPupilXPos);
    rightPupilY.set(clampedY);
  }, [leftPupilX, leftPupilY, rightPupilX, rightPupilY]);

  // Handle mouse leave to reset pupils to rest state
  const handleMouseLeave = useCallback(() => {
    if (!eyeRef.current) return;
    const rect = eyeRef.current.getBoundingClientRect();
    const tenthWidth = rect.width / 10;
    const baseY = -rect.height * 0.15; // Looking up rest state
    
    leftPupilX.set(-tenthWidth);
    leftPupilY.set(baseY);
    rightPupilX.set(tenthWidth);
    rightPupilY.set(baseY);
  }, [leftPupilX, leftPupilY, rightPupilX, rightPupilY]);

  // Handle touch events (disable tracking on mobile)
  const handleTouchStart = useCallback(() => {
    isMouseTracking.current = false;
  }, []);

  const handleTouchEnd = useCallback(() => {
    isMouseTracking.current = true;
  }, []);

  useEffect(() => {
    // Set initial rest state
    if (eyeRef.current) {
      const rect = eyeRef.current.getBoundingClientRect();
      const tenthWidth = rect.width / 10;
      const baseY = -rect.height * 0.15; // Looking up rest state
      
      leftPupilX.set(-tenthWidth);
      leftPupilY.set(baseY);
      rightPupilX.set(tenthWidth);
      rightPupilY.set(baseY);
    }

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseLeave, handleTouchStart, handleTouchEnd, leftPupilX, leftPupilY, rightPupilX, rightPupilY]);

  return (
    <section className="min-h-screen flex items-center justify-center bg-[#EEDDAB] relative overflow-hidden pt-16">
      {/* Main content */}
      <div className="text-center relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {/* TE */}
          <span className="teddy-title">TE</span>
          
          {/* Eye structure */}
          <div className="relative mx-2 md:mx-4">
            {/* White oval (eye whites) with overflow hidden to clip pupils */}
            <div
              ref={eyeRef}
              className="relative w-32 h-16 md:w-48 md:h-24 bg-white rounded-full shadow-lg overflow-hidden"
            >
              {/* Left pupil (behind the white oval) */}
              <motion.div
                className="absolute bg-black rounded-full"
                style={{
                  x: springLeftX,
                  y: springLeftY,
                  width: 'clamp(60px, 12vw, 90px)', // Smaller pupil size
                  height: 'clamp(60px, 12vw, 90px)',
                  left: '40%', // Much closer to center
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              
              {/* Right pupil (behind the white oval) */}
              <motion.div
                className="absolute bg-black rounded-full"
                style={{
                  x: springRightX,
                  y: springRightY,
                  width: 'clamp(60px, 12vw, 90px)', // Smaller pupil size
                  height: 'clamp(60px, 12vw, 90px)',
                  left: '60%', // Much closer to center
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          </div>
          
          {/* Y */}
          <span className="teddy-title">Y</span>
        </motion.div>
        
        {/* Mouth element */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="mt-6 md:mt-8"
        >
          <div className="inline-block w-24 h-4 md:w-32 md:h-6 bg-black rounded-full"></div>
        </motion.div>
      </div>
    </section>
  );
}