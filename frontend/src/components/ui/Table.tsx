'use client';

import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  density?: 'compact' | 'normal' | 'relaxed';
}

export const Table: React.FC<TableProps> = ({
  children,
  density = 'normal',
  className = '',
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <table
        className={`w-full text-left font-mono text-xs ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead
      className={`bg-slate-950/90 text-slate-400 border-b border-white/[0.08] uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-10 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody
      className={`divide-y divide-white/[0.04] text-slate-200 ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }> = ({
  children,
  interactive = true,
  className = '',
  ...props
}) => {
  return (
    <tr
      className={`transition-colors duration-100 ${
        interactive ? 'hover:bg-slate-900/60 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <th className={`py-3 px-3.5 font-semibold ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <td className={`py-2.5 px-3.5 whitespace-nowrap ${className}`} {...props}>
      {children}
    </td>
  );
};
