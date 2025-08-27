import 'server-only';
import * as React from 'react';
import { common, createLowlight } from 'lowlight';
import CodeblockClient from './CodeBlockClient';

const lowlight = createLowlight(common);

export interface CodeblockProps {
  content: string;
  language: string;
}

export default function Codeblock({ content, language }: CodeblockProps) {
  const tree = lowlight.highlight(language, content);

  return <CodeblockClient highlighted={tree} language={language} />;
}
