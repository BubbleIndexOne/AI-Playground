import { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export function TableContainer({
  children,
  className = '',
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-xl border border-subtle bg-card shadow-card ${className}`}
    >
      <table className="w-full border-collapse text-left text-[13px]">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { readonly children: ReactNode }) {
  return (
    <thead className="border-b border-subtle bg-raised/50 text-[12px] font-medium text-secondary">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { readonly children: ReactNode }) {
  return <tbody className="divide-y divide-subtle">{children}</tbody>;
}

export function TableRow({
  children,
  interactive = false,
  className = '',
  ...rest
}: HTMLAttributes<HTMLTableRowElement> & { readonly interactive?: boolean }) {
  return (
    <tr
      className={`hover:bg-hover/60 transition-colors duration-120 ease-out ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  children,
  className = '',
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-2.5 font-medium text-secondary whitespace-nowrap ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = '',
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 text-primary align-middle ${className}`} {...rest}>
      {children}
    </td>
  );
}
