'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

type SlugContextValue = (text: string) => string;

const SlugContext = React.createContext<SlugContextValue | null>(null);

function slugify(text: string): string {
  return text
    .normalize('NFKD') // Normalize Unicode (e.g., accents)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumerics with -
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

export function SlugProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const usedSlugsRef = React.useRef(new Map<string, number>());
  const [prevPathname, setPrevPathname] = React.useState(pathname);

  // Storing information from previous renders pattern (https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    usedSlugsRef.current.clear();
  }

  const generateUniqueSlug = React.useCallback(
    (text: string): string => {
      const baseSlug = slugify(text) || 'heading';
      const key = baseSlug;
      const currentCount = usedSlugsRef.current.get(key) || 0;
      const newCount = currentCount + 1;
      usedSlugsRef.current.set(key, newCount);

      // First occurrence gets no suffix, duplicates start at -1
      return newCount === 1 ? baseSlug : `${baseSlug}-${newCount - 1}`;
    },
    [usedSlugsRef],
  );

  return (
    <SlugContext.Provider value={generateUniqueSlug}>
      {children}
    </SlugContext.Provider>
  );
}

export function useSlugContext() {
  const context = React.useContext(SlugContext);
  if (!context) {
    throw new Error('useSlugContext must be used within a SlugProvider');
  }
  return context;
}
