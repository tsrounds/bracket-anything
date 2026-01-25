'use client';

import { motion } from 'framer-motion';

interface AIQuizAssistantButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function AIQuizAssistantButton({
  onClick,
  disabled = false,
  className = '',
}: AIQuizAssistantButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        relative overflow-hidden
        w-full py-4 px-6
        bg-gradient-to-r from-[#F58143] to-[#ff9a5c]
        rounded-xl
        text-white font-semibold font-['PP_Object_Sans']
        flex items-center justify-center gap-3
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:shadow-lg hover:shadow-[#F58143]/20
        ${className}
      `}
    >
      {/* Sparkle Icon */}
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z"
          fill="currentColor"
        />
        <path
          d="M5 16L5.54 18.54L8 19L5.54 19.46L5 22L4.46 19.46L2 19L4.46 18.54L5 16Z"
          fill="currentColor"
          opacity="0.7"
        />
        <path
          d="M19 14L19.35 15.65L21 16L19.35 16.35L19 18L18.65 16.35L17 16L18.65 15.65L19 14Z"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>

      <span>Want some help?</span>

      {/* Subtle shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration: 3,
          ease: 'linear',
        }}
      />
    </motion.button>
  );
}
