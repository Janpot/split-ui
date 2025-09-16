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

export async function DemoSection({
  element,
  files,
  hideCode,
}: DemoSectionProps) {
  const uniqueDemoClass = `demo-${Math.random().toString(36).substring(2, 15)}`;

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
        `<pre class="${styles.codeBlock ?? ''}" dir="ltr"><code class="hljs language-${language}">${highlighted}</code></pre>`,
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
