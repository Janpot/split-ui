'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSlugContext } from './SlugContext';

interface HeaderProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

// Extract text content from React children
function getTextContent(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }
  if (typeof children === 'number') {
    return children.toString();
  }
  if (Array.isArray(children)) {
    return children.map(getTextContent).join('');
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return getTextContent(
      (children as React.ReactElement<React.PropsWithChildren<object>>).props
        .children,
    );
  }
  return '';
}

export default function Header({
  level,
  children,
  className = '',
}: HeaderProps) {
  const headerRef = React.useRef<HTMLHeadingElement>(null);
  const generateUniqueSlug = useSlugContext();
  const Tag = `h${level}` as const;
  // Generate ID from text content using context
  const textContent = getTextContent(children);

  const idRef = React.useRef<string | undefined>(undefined);
  idRef.current ??= generateUniqueSlug(textContent);
  const id = idRef.current;

  // Don't show anchor links on h1 elements
  const showAnchorLink = level !== 1;

  return (
    <Tag ref={headerRef} id={id} className={`header-with-anchor ${className}`}>
      {children}
      {showAnchorLink && (
        <Link
          href={`#${id}`}
          replace
          className="anchor-link anchor-link-right"
          aria-label={`Link to ${textContent}`}
          title="Copy link to this section"
        >
          #
        </Link>
      )}
    </Tag>
  );
}
