'use client';

import * as React from 'react';
import clsx from 'clsx';
import { openStackBlitzProject } from '../utils/stackblitz';
import styles from './CodeSection.module.css';

interface CodeSectionProps {
  files: Map<string, string>;
}

export function CodeSection({ files }: CodeSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const fileNames = Array.from(files.keys());
  const [activeTab, setActiveTab] = React.useState(fileNames[0] || '');

  const handleTabClick = (fileName: string) => {
    setActiveTab(fileName);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleStackBlitz = () => {
    const sourceFiles: Record<string, string> = {};
    const tempDiv = document.createElement('div');
    for (const [fileName, content] of files.entries()) {
      tempDiv.innerHTML = content;
      sourceFiles[`src/${fileName}`] = tempDiv.innerText;
    }
    openStackBlitzProject({ files: sourceFiles });
  };

  return (
    <div className={styles.codeSection}>
      <div className={styles.codeHeader}>
        <div className={styles.tabs}>
          {fileNames.map((fileName) => (
            <button
              key={fileName}
              className={clsx(styles.tab, {
                [styles.active]: activeTab === fileName,
              })}
              onClick={() => handleTabClick(fileName)}
            >
              {fileName}
            </button>
          ))}
        </div>
        <div className={styles.toolbar}>
          <button className={styles.toolbarBtn} onClick={handleStackBlitz}>
            Open in StackBlitz
          </button>
        </div>
      </div>

      <div
        className={clsx(styles.codeContainer, {
          [styles.expanded]: isExpanded,
          [styles.collapsed]: !isExpanded,
        })}
        tabIndex={-1}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (
            event.key === 'a' &&
            (event.metaKey || event.ctrlKey) &&
            !event.shiftKey &&
            !event.altKey
          ) {
            event.preventDefault();
            window.getSelection()?.selectAllChildren(event.currentTarget);
          }
        }}
      >
        <div className={styles.codeContent}>
          <div
            dangerouslySetInnerHTML={{ __html: files.get(activeTab) || '' }}
          />
        </div>
      </div>
      <button
        className={clsx(styles.toggleButton, {
          [styles.expanded]: isExpanded,
          [styles.collapsed]: !isExpanded,
        })}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <span>{isExpanded ? 'Click to collapse' : 'Click to expand'}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M6 8.5L2.5 5 3.5 4 6 6.5 8.5 4 9.5 5 6 8.5z" />
        </svg>
      </button>
    </div>
  );
}
