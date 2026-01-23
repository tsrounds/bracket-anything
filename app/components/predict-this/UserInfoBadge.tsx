'use client';

import Image from 'next/image';

interface UserInfoBadgeProps {
  name: string;
  avatar?: string;
  className?: string;
}

export default function UserInfoBadge({ name, avatar, className = '' }: UserInfoBadgeProps) {
  // Extract first name and last initial
  const nameParts = name.split(' ');
  const displayName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}`
    : nameParts[0];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {avatar ? (
        <Image
          src={avatar}
          alt={name}
          width={40}
          height={40}
          className="rounded-full bg-white/10 p-1"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 font-semibold">
          {name[0]?.toUpperCase() || '?'}
        </div>
      )}
      <span className="text-white/90 font-['PP_Object_Sans'] text-sm md:text-base">
        {displayName}
      </span>
    </div>
  );
}
