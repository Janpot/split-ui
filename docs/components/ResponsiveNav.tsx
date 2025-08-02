'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
      const sidebar = document.querySelector('.sidebar');
      const menuButton = document.querySelector('.menu-button');

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
      <header className="mobile-header">
        <Link href="/" className="mobile-brand">
          React Flex Panels
        </Link>
        <button
          className="menu-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="mobile-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <Link href="/" className="nav-brand">
          React Flex Panels
        </Link>
        <div className="nav-links">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'nav-link-active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <a
          href="https://github.com/Janpot/react-flex-panels"
          className="nav-github"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </nav>
    </>
  );
}
