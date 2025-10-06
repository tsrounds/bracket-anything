'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useMemo, useRef, useState, useEffect } from 'react';

type Props = {
  targetId?: string;
  color?: string;
  strokeWidth?: number;
  width?: string;
  offsetBottom?: number;
  replayOnReenter?: boolean;
  showCta?: boolean;
  ctaText?: string;
  className?: string;
};

export default function SpiralArrow({
  targetId = 'red-rising',
  color = 'currentColor',
  strokeWidth = 4,
  width = 'clamp(220px, 32vw, 520px)',
  offsetBottom = 32,
  replayOnReenter = true,
  showCta = false,
  ctaText = 'Scroll to Red Rising',
  className,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const inView = useInView(wrapperRef, { margin: '0px 0px -20% 0px', once: !replayOnReenter });

  // Even smaller vertical line that ends well before the caret
  const pathD = useMemo(
    () => 'M 0 -20 L 0 5',
    []
  );

  const [drawDone, setDrawDone] = useState(false);

  useEffect(() => {
    if (!inView) setDrawDone(false);
  }, [inView]);

  const onCta = () => {
    const el = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      ref={wrapperRef}
      className={[
        'pointer-events-none absolute left-1/2 -translate-x-1/2 select-none z-10',
        className
      ].filter(Boolean).join(' ')}
      style={{ bottom: offsetBottom, width }}
      aria-hidden="true"
    >
      <motion.svg
        viewBox="-20 -30 40 60"
        aria-hidden="true"
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        initial={prefersReduced ? { opacity: 1, y: 50 } : { opacity: 0, y: 30 }}
        animate={prefersReduced ? { opacity: 1, y: 50 } : inView ? { opacity: 1, y: 50 } : { opacity: 0, y: 30 }}
        transition={
          prefersReduced
            ? undefined
            : {
                opacity: { duration: 0.6, ease: 'easeOut' },
                y: { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] } // bounce ease
              }
        }
      >
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={prefersReduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={prefersReduced ? { pathLength: 1 } : inView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={prefersReduced ? undefined : { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          onUpdate={(latest) => {
            if (!prefersReduced && typeof latest === 'object' && 'pathLength' in latest) {
              const p = (latest as any).pathLength as number;
              if (p >= 0.999 && !drawDone) setDrawDone(true);
            }
          }}
        />

        {/* Caret positioned to meet the line's rounded cap perfectly (line ends at 0,5, strokeWidth=3) */}
        <motion.g
          transform="translate(0,8)"
          initial={prefersReduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          animate={
            prefersReduced
              ? { opacity: 1, scale: 1 }
              : inView
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.8 }
          }
          transition={{ duration: 0.4, delay: prefersReduced ? 0 : 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <path d="M -8 0 L 0 12 L 8 0" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>

        {/* Continuous gentle bounce after draw completes */}
        {drawDone && !prefersReduced && (
          <motion.g
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <g opacity="0" />
          </motion.g>
        )}
      </motion.svg>

      {showCta && (
        <div className="mt-2 w-full flex justify-center pointer-events-auto">
          <button
            type="button"
            onClick={onCta}
            aria-label="Scroll to Red Rising"
            className="px-3 py-1 rounded-full text-xs md:text-sm bg-current/10 text-current border border-current/30 backdrop-blur-sm hover:bg-current/15 active:scale-[0.98] transition"
          >
            {ctaText}
          </button>
        </div>
      )}
    </div>
  );
}


