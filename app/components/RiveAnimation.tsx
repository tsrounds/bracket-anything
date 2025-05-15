'use client';

import { useEffect, useRef } from 'react';
import { Rive } from '@rive-app/webgl';

interface RiveAnimationProps {
  src: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  stateMachines?: string[];
  className?: string;
}

export default function RiveAnimation({
  src,
  width = 500,
  height = 500,
  autoplay = true,
  stateMachines = [],
  className = '',
}: RiveAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const riveRef = useRef<Rive | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const rive = new Rive({
      src,
      canvas: canvasRef.current,
      autoplay,
      stateMachines,
      onLoad: () => {
        console.log('Rive animation loaded');
      },
    });

    riveRef.current = rive;

    return () => {
      riveRef.current?.stop();
      riveRef.current = null;
    };
  }, [src, autoplay, stateMachines]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
} 