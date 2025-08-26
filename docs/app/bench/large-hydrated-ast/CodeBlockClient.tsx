'use client';

import * as React from 'react';
import styles from '../../../components/CodeBlock.module.css';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';

export interface CodeblockProps {
  highlighted: any;
  language: string;
}

export default function CodeblockClient({
  highlighted,
  language,
}: CodeblockProps) {
  const children = toJsxRuntime(highlighted, { Fragment, jsx, jsxs });
  return (
    <div className={styles.codeWrapper}>
      <pre>
        <code className="hljs">{children}</code>
      </pre>
    </div>
  );
}
