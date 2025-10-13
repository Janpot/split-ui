import 'server-only';
import * as React from 'react';
import clsx from 'clsx';
import { CodeSection } from './CodeSection';
import styles from './DemoSection.module.css';
import hljs from 'highlight.js';
import { createHash } from 'crypto';

interface DemoSectionProps {
  element: React.ReactElement;
  files: Map<string, string>;
  hideCode?: boolean;
}

// Generate a unique class name based on file content hash
function generateUniqueClass(files: Map<string, string>): string {
  // Concatenate filepaths and contents with delimiter
  const content = Array.from(files.entries())
    .flatMap(([filepath, content]) => [filepath, content])
    .join('\n');
  
  // Use MD5 hash
  const hash = createHash('md5').update(content).digest('hex');
  
  return `demo-${hash.substring(0, 12)}`;
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
