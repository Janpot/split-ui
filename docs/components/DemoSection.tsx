import 'server-only';
import * as React from 'react';
import clsx from 'clsx';
import { CodeSection } from './CodeSection';
import styles from './DemoSection.module.css';
import hljs from 'highlight.js';

interface DemoSectionProps {
  element: React.ReactElement;
  files: Map<string, string>;
  hideCode?: boolean;
}

// Generate a unique class name based on file content hash
function generateUniqueClass(files: Map<string, string>): string {
  // Create a simple hash from the files content
  const content = Array.from(files.entries())
    .map(([name, content]) => `${name}:${content}`)
    .join('|');
  
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `demo-${Math.abs(hash).toString(36)}`;
}

export async function DemoSection({
  element,
  files,
  hideCode,
}: DemoSectionProps) {
  const uniqueDemoClass = generateUniqueClass(files);

  // Extract all CSS files for styling the demo container
  const cssFiles = Array.from(files.entries()).filter(([fileName]) =>
    fileName.endsWith('.css'),
  );

  // Create highlighted files for CodeSection
  const codeFiles = new Map(
    Array.from(files.entries(), ([fileName, content]) => {
      const language = fileName.endsWith('.css') ? 'css' : 'typescript';
      const { value: highlighted } = hljs.highlight(content, { language });
      return [
        fileName,
        `<pre dir="ltr"><code class="hljs language-${language}">${highlighted}</code></pre>`,
      ];
    }),
  );

  return (
    <div className={styles.demoSection}>
      {cssFiles.length > 0 ? (
        <style>{`
          .${styles.demoContainer}.${uniqueDemoClass} {
            ${cssFiles.map(([, cssContent]) => cssContent).join('\n')}
          }
        `}</style>
      ) : null}
      <div className={clsx(styles.demoContainer, uniqueDemoClass)}>
        {element}
      </div>
      {hideCode ? null : <CodeSection files={codeFiles} />}
    </div>
  );
}
