import React from 'react';
import styles from './Table.module.css';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ children, ...props }: TableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table {...props}>{children}</table>
    </div>
  );
}
