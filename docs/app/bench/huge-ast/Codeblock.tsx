import 'server-only';
import * as React from 'react';
import { common, createLowlight } from 'lowlight';
import styles from '../../../components/CodeBlock.module.css';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';

const lowlight = createLowlight(common);

export interface CodeblockProps {
  content: string;
  language: string;
}

export default function Codeblock({ content, language }: CodeblockProps) {
  const tree = lowlight.highlight(language, content);

  const children = toJsxRuntime(tree, { Fragment, jsx, jsxs });
  return (
    <div className={styles.codeWrapper}>
      <pre>
        <code className="hljs">{children}</code>
      </pre>
    </div>
  );
}
