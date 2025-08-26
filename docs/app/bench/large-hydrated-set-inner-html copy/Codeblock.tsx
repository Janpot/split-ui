import 'server-only';
import * as React from 'react';
import hljs from 'highlight.js';
import CodeblockClient from './CodeBlockClient';

export interface CodeblockProps {
  content: string;
  language: string;
}

export default function Codeblock({ content, language }: CodeblockProps) {
  const { value: highlighted } = hljs.highlight(content, { language });

  return <CodeblockClient highlighted={highlighted} language={language} />;
}
