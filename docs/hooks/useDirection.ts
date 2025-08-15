'use client';

import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): 'ltr' | 'rtl' {
  return getComputedStyle(document.documentElement).direction as 'ltr' | 'rtl';
}

function getServerSnapshot(): 'ltr' | 'rtl' {
  return 'ltr';
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function useDirection() {
  const dir = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setDir = (direction: 'ltr' | 'rtl') => {
    document.documentElement.setAttribute('dir', direction);
    // Manually notify all subscribers
    notifyListeners();
  };

  return { dir, setDir };
}
