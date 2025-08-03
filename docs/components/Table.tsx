import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ children, ...props }: TableProps) {
  return (
    <div className="table-wrapper">
      <table {...props}>
        {children}
      </table>
    </div>
  );
}