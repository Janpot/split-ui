import * as React from 'react';
import './HighlightedCode.css';

export interface HighlightedCodeProps {
  code?: string;
  highlights?: string;
}

export default function HighlightedCode({
  code,
  highlights,
}: HighlightedCodeProps) {
  const codeRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (!highlights) {
      return;
    }
    const textNode = codeRef.current?.firstChild;
    if (!textNode) {
      throw new Error('No text node found in code element');
    }
    const addedRanges: Array<{ cls: string; ranges: Range[] }> = [];
    highlights.split('|').forEach((part) => {
      const [cls, ranges] = part.split(':');
      const rangeObjects = ranges.split(',').map((range) => {
        const [startStr, endStr] = range.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        const rangeObject = new Range();
        rangeObject.setStart(textNode, start);
        rangeObject.setEnd(textNode, end);
        return rangeObject;
      });
      const highlight = CSS.highlights.get(cls) || new Highlight();
      CSS.highlights.set(cls, highlight);
      rangeObjects.forEach((rangeObject) => {
        highlight.add(rangeObject);
      });
      addedRanges.push({ cls, ranges: rangeObjects });
    });
    return () => {
      addedRanges.forEach(({ cls, ranges }) => {
        const highlight = CSS.highlights.get(cls);
        if (highlight) {
          ranges.forEach((range) => {
            highlight.delete(range);
          });
          if (highlight.size === 0) {
            CSS.highlights.delete(cls);
          }
        }
      });
    };
  }, [highlights]);
  return (
    <pre>
      <code ref={codeRef}>{code}</code>
    </pre>
  );
}
