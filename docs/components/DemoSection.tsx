"use server";
import * as React from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

interface DemoSectionProps {
  demo: React.ReactElement;
  tsSource: string;
  cssSource?: string;
  hideCode?: boolean;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeHighlight)
  .use(rehypeStringify);

export async function DemoSection({
  demo,
  tsSource,
  cssSource,
  hideCode,
}: DemoSectionProps) {
  const tsCodeBlock = `\`\`\`tsx\n${tsSource}\n\`\`\``;
  const tsResult = await processor.process(tsCodeBlock);
  const highlightedTsCode = tsResult.toString();

  let highlightedCssCode = "";
  if (cssSource) {
    const cssCodeBlock = `\`\`\`css\n${cssSource}\n\`\`\``;
    const cssResult = await processor.process(cssCodeBlock);
    highlightedCssCode = cssResult.toString();
  }

  const uniqueDemoClass = `demo-${Math.random().toString(36).substring(2, 15)}`;

  return (
    <div className="demo-section">
      {cssSource ? (
        <style>{`
          .demo-container.${uniqueDemoClass} {
            ${cssSource}
          }
        `}</style>
      ) : null}
      <div className={`demo-container ${uniqueDemoClass}`}>{demo}</div>
      {hideCode ? null : (
        <div className="code-container">
          <div className="code-section">
            <h4>TypeScript</h4>
            <div dangerouslySetInnerHTML={{ __html: highlightedTsCode }} />
          </div>
          {cssSource ? (
            <div className="code-section">
              <h4>CSS</h4>
              <div dangerouslySetInnerHTML={{ __html: highlightedCssCode }} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
