'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const base =
  'inline-flex items-center justify-center rounded-2xl px-5 py-3 font-medium text-base ' +
  'transition-all duration-200 ease-smooth disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2';

const styles: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white shadow-soft hover:bg-primary-700 active:bg-primary-800',
  secondary:
    'bg-white text-neutral-900 border border-neutral-200 shadow-soft hover:bg-neutral-50',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth, className = '', children, ...rest }, ref) => (
    <button
      ref={ref}
      className={`${base} ${styles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
