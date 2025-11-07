import 'server-only';
import * as React from 'react';
import { CodeSection } from './CodeSection';
import styles from './DemoSection.module.css';
import sourceTsx from '@wooorm/starry-night/source.tsx';
import sourceCss from '@wooorm/starry-night/source.css';
import { common, createStarryNight } from '@wooorm/starry-night';

type Root = ReturnType<
  Awaited<ReturnType<typeof createStarryNight>>['highlight']
>;

interface Range {
  start: number;
  end: number;
  classes: string[];
}

function flattenNode(
  node: Root | Root['children'][0],
  offset = 0,
  parentClasses: string[] = [],
): Range[] {
  if (node.type === 'root' || node.type === 'element') {
    let childOffset = offset;
    const ranges: Range[] = [];
    for (const child of node.children) {
      const childClasses = [...parentClasses];
      const childClass =
        node.type === 'element' ? node.properties.className : undefined;

      if (childClass) {
        const values = Array.isArray(childClass) ? childClass : [childClass];
        childClasses.push(...values.map(String));
      }

      const childRanges = flattenNode(child, childOffset, childClasses);
      ranges.push(...childRanges);
      childOffset =
        childRanges.length > 0
          ? childRanges[childRanges.length - 1].end
          : childOffset;
    }
    return ranges;
  } else if (node.type === 'text') {
    const length = node.value.length;
    return [
      {
        start: offset,
        end: offset + length,
        classes: parentClasses,
      },
    ];
  }
  return [];
}

function flatten(tree: Root): Range[] {
  const ranges = flattenNode(tree);
  return ranges.filter((range) => range.classes.length > 0);
}

function getHighlightDataAttributeValue(ranges: Range[]): string {
  const classes = new Set<string>();
  const constraints = new Map<string, Set<string>>();

  for (const range of ranges) {
    for (let i = 0; i < range.classes.length - 1; i++) {
      const before = range.classes[i];
      const constraint = constraints.get(before) || new Set<string>();
      constraints.set(before, constraint);
      range.classes.slice(i + 1).forEach((after) => constraint.add(after));
    }
    for (const cls of range.classes) {
      classes.add(cls);
    }
  }

  for (const [key, set] of constraints) {
    if (set.has(key)) {
      throw new Error(`Cycle detected involving "${key}"`);
    }
  }

  const priority = Array.from(classes).sort((a, b) => {
    const aConstraints = constraints.get(a);
    const bConstraints = constraints.get(b);
    if (aConstraints && aConstraints.has(b)) {
      return -1;
    }
    if (bConstraints && bConstraints.has(a)) {
      return 1;
    }
    return 0;
  });

  const rangeMap = new Map<string, [start: number, end: number][]>();
  for (const range of ranges) {
    const start = range.start;
    const end = range.end;
    for (const cls of range.classes) {
      const existing = rangeMap.get(cls) || [];
      rangeMap.set(cls, existing);
      existing.push([start, end]);
    }
  }

  return priority
    .map((cls) => {
      const ranges = rangeMap.get(cls) || [];
      return (
        cls + ':' + ranges.map(([start, end]) => `${start}-${end}`).join(',')
      );
    })
    .join('|');
}

interface DemoSectionProps {
  element: React.ReactElement;
  files: Map<string, string>;
  hideCode?: boolean;
}

export async function DemoSection({
  element,
  files,
  hideCode,
}: DemoSectionProps) {
  const starryNight = await createStarryNight([sourceCss, sourceTsx]);
  console.log(starryNight.scopes());

  const highlights = new Map(
    await Promise.all(
      Array.from(files.entries(), async ([fileName, content]) => {
        const language = fileName.endsWith('.css') ? 'css' : 'tsx';
        const scope = starryNight.flagToScope(language);
        console.log({ language, scope });
        if (!scope) {
          throw new Error(`Unsupported language: ${language}`);
        }
        const tree = starryNight.highlight(content, scope);
        const ranges = flatten(tree);

        return [fileName, getHighlightDataAttributeValue(ranges)] as const;
      }),
    ),
  );

  return (
    <div className={styles.demoSection}>
      <div className={styles.demoContainer}>{element}</div>
      {hideCode ? null : <CodeSection files={files} highlights={highlights} />}
    </div>
  );
}
