'use client';

// Lightweight name+avatar persistence keyed to the anonymous Firebase uid.
// Reuses local storage to avoid re-prompting on every page load. The user
// confirmed (see Q&A) that WC 2026 entries skip the full phone registration.

import { useEffect, useState } from 'react';

interface Profile {
  name: string;
  avatar: string | null;
}

const KEY = 'wc2026:profile';

export function useAvatarName() {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProfileState(JSON.parse(raw) as Profile);
    } catch {
      /* noop */
    }
    setHydrated(true);
  }, []);

  const setProfile = (next: Profile) => {
    setProfileState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  return { profile, setProfile, hydrated };
}
