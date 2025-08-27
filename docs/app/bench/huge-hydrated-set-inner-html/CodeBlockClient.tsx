'use client';

import * as React from 'react';
import styles from '../../../components/CodeBlock.module.css';

export interface CodeblockProps {
  highlighted: string;
  language: string;
}

export default function CodeblockClient({
  highlighted,
  language,
}: CodeblockProps) {
  return (
    <div
      className={styles.codeWrapper}
      dangerouslySetInnerHTML={{
        __html: `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`,
      }}
    />
  );
}
