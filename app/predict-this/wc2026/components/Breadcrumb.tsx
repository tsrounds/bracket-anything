'use client';

import Link from 'next/link';

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto max-w-2xl px-4 pt-4 pb-2 text-sm text-neutral-500"
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((crumb, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="hover:text-primary-600 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={last ? 'text-neutral-900 font-medium' : ''}>
                  {crumb.label}
                </span>
              )}
              {!last && <span className="text-neutral-300">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
