import { HTMLAttributes } from 'react';

export function Card({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`bg-white rounded-2xl border border-neutral-200 shadow-soft ${className}`}
    >
      {children}
    </div>
  );
}
