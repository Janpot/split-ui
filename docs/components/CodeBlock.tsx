import styles from './CodeBlock.module.css';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  return (
    <div className={styles.codeWrapper}>
      <pre className={className}>
        {children}
      </pre>
    </div>
  );
}