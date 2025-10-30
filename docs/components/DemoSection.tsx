import 'server-only';
import * as React from 'react';
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
      <div className={styles.demoContainer}>{element}</div>
      {hideCode ? null : <CodeSection files={codeFiles} />}
    </div>
  );
}
