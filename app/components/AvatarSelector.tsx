'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface AvatarSelectorProps {
  onAvatarSelect: (avatarPath: string) => void;
  initialAvatar?: string;
}

export default function AvatarSelector({ onAvatarSelect, initialAvatar }: AvatarSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(initialAvatar || '');
  const [preloadedImages, setPreloadedImages] = useState<string[]>([]);

  // Generate array of avatar paths (1-150)
  const avatarPaths = Array.from({ length: 150 }, (_, i) => `/avatars/avatar-${i + 1}.png`);

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      const loadedImages = await Promise.all(
        avatarPaths.map(async (path) => {
          const img = new window.Image();
          img.src = path;
          return new Promise<string>((resolve) => {
            img.onload = () => resolve(path);
          });
        })
      );
      setPreloadedImages(loadedImages);
    };

    preloadImages();
  }, []);

  const handleAvatarSelection = () => {
    if (!currentAvatar) {
      // First time selection
      selectRandomAvatar();
    } else {
      // Regenerate existing avatar
      selectRandomAvatar();
    }
  };

  const selectRandomAvatar = () => {
    setIsSelecting(true);
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % avatarPaths.length;
      setCurrentAvatar(avatarPaths[currentIndex]);
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      const finalIndex = Math.floor(Math.random() * avatarPaths.length);
      setCurrentAvatar(avatarPaths[finalIndex]);
      setIsSelecting(false);
      onAvatarSelect(avatarPaths[finalIndex]);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {currentAvatar && (
            <motion.div
              key={currentAvatar}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Image
                src={currentAvatar}
                alt="Selected avatar"
                fill
                className="object-contain p-2"
                sizes="(max-width: 128px) 100vw, 128px"
                priority
                style={{ objectPosition: 'center' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={handleAvatarSelection}
          disabled={isSelecting}
          className={`px-6 py-2 rounded-lg font-medium transition-colors
            ${isSelecting 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          {isSelecting 
            ? 'Selecting...' 
            : currentAvatar 
              ? 'Regenerate Avatar' 
              : 'Select Avatar'}
        </button>
      </div>
    </div>
  );
} 