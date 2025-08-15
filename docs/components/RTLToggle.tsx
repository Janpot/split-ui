'use client';

import { PilcrowLeft, PilcrowRight } from 'lucide-react';
import { useDirection } from '@/hooks/useDirection';
import styles from './RTLToggle.module.css';

export default function RTLToggle() {
  const { dir, setDir } = useDirection();
  const isRTL = dir === 'rtl';

  const toggleDirection = () => {
    setDir(isRTL ? 'ltr' : 'rtl');
  };

  const Icon = isRTL ? PilcrowLeft : PilcrowRight;
  const label = isRTL ? 'Left to Right' : 'Right to Left';

  return (
    <button
      className={styles.toggle}
      onClick={toggleDirection}
      aria-label={`Switch to ${label} layout`}
      title={`Switch to ${label} layout`}
    >
      <Icon className={styles.icon} size={16} />
      <span className={styles.label}>{label}</span>
    </button>
  );
}
