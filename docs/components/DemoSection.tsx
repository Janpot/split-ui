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

interface CodeBlockProps {
  code: string;
  language: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const { value: highlighted } = hljs.highlight(code, { language });
  return (
    <pre className={styles.codeBlock}>
      <code
        className={`hljs language-${language}`}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </pre>
  );
}

export async function DemoSection({
  element,
  files,
  hideCode,
}: DemoSectionProps) {
  const uniqueDemoClass = `demo-${Math.random().toString(36).substring(2, 15)}`;

  // Extract source files
  const tsSource = files.get('index.tsx') || '';
  const cssSource = files.get('index.css') || '';

  return (
    <div className={styles.demoSection}>
      {cssSource ? (
        <style>{`
          .${styles.demoContainer}.${uniqueDemoClass} {
            ${cssSource}
          }
        `}</style>
      ) : null}
      <div className={clsx(styles.demoContainer, uniqueDemoClass)}>
        {element}
      </div>
      {hideCode ? null : (
        <CodeSection
          tsCode={<CodeBlock code={tsSource} language="typescript" />}
          cssCode={
            cssSource ? (
              <CodeBlock code={cssSource} language="css" />
            ) : undefined
          }
          tsSource={tsSource}
          cssSource={cssSource}
        />
      )}
    </div>
  );
}
