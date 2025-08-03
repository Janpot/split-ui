'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { GitHubIcon } from './icons';
import styles from './ResponsiveNav.module.css';

const navLinks = [
  { href: '/resizable', label: 'Resizable' },
  { href: '/custom-resizer', label: 'Custom Resizer' },
  { href: '/nested', label: 'Nested' },
  { href: '/persistence', label: 'Persistence' },
  { href: '/static', label: 'Static Layouts' },
  { href: '/conditional', label: 'Conditional Panels' },
];

export default function ResponsiveNav() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  // Close sidebar when route changes (mobile)
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside (mobile)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector(`.${styles.sidebar}`);
      const menuButton = document.querySelector(`.${styles.menuButton}`);

      if (
        isOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <Link href="/" className={styles.mobileBrand}>
          React Flex Panels
        </Link>
        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={clsx(styles.sidebar, { [styles.sidebarOpen]: isOpen })}
        inert={!isOpen}
        aria-hidden={!isOpen}
      >
        <Link href="/" className={styles.navBrand}>
          React Flex Panels
        </Link>
        <div className={styles.navLinks}>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(styles.navLink, {
                [styles.navLinkActive]: pathname === href,
              })}
            >
              {label}
            </Link>
          ))}
        </div>
        <a
          href="https://github.com/Janpot/react-flex-panels"
          className={styles.navGithub}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub Repository"
          title="View on GitHub"
        >
          <GitHubIcon className={styles.githubIcon} size={20} />
          GitHub
        </a>
      </nav>
    </>
  );
}
