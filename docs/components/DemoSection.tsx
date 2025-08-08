import 'server-only';
import * as React from 'react';
import clsx from 'clsx';
import { CodeSection } from './CodeSection';
import styles from './DemoSection.module.css';
import hljs from 'highlight.js';

interface DemoSectionProps {
  demo: React.ReactElement;
  tsSource: string;
  cssSource?: string;
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
        className={`language-${language}`}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </pre>
  );
}

export async function DemoSection({
  demo,
  tsSource,
  cssSource,
  hideCode,
}: DemoSectionProps) {
  const uniqueDemoClass = `demo-${Math.random().toString(36).substring(2, 15)}`;

  return (
    <div className={styles.demoSection}>
      {cssSource ? (
        <style>{`
          .${styles.demoContainer}.${uniqueDemoClass} {
            ${cssSource}
          }
        `}</style>
      ) : null}
      <div className={clsx(styles.demoContainer, uniqueDemoClass)}>{demo}</div>
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
