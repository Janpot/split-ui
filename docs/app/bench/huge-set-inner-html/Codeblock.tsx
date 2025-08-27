import 'server-only';
import * as React from 'react';
import hljs from 'highlight.js';
import styles from '../../../components/CodeBlock.module.css';

export interface CodeblockProps {
  content: string;
  language: string;
}

export default function Codeblock({ content, language }: CodeblockProps) {
  const { value: highlighted } = hljs.highlight(content, { language });

  return (
    <div
      className={styles.codeWrapper}
      dangerouslySetInnerHTML={{
        __html: `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`,
      }}
    />
  );
}
