import React from 'react';

interface AnimatedButtonProps {
  onClick?: (e?: React.MouseEvent<HTMLButtonElement> | React.FormEvent) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

export default function AnimatedButton({
  onClick,
  disabled = false,
  className = '',
  children,
  type = 'button'
}: AnimatedButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative ${className}`}
      style={{
        transition: "transform 0.1s ease"
      }}
      onMouseDown={e => { e.currentTarget.style.transform = "translateY(2px)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "translateY(0)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {children}
    </button>
  );
} 